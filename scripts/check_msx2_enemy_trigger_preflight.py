#!/usr/bin/env python3
"""Preflight budget for the MSX2 enemy behaviour trigger model.

This tool is intentionally isolated from the Mideas generator.  It models the
data decision recorded in exchange.txt:

* every node: ``cell, action, arg, next, nextAlt`` = 5 bytes;
* the branch policy is packed into the high three bits of ``action``;
* every reusable asset has a one-byte node-count prefix;
* the visible sequence number is an editor label, not an extra byte;
* one byte of per-slot state remembers the last cell fired;
* the graph is not copied to per-enemy RAM.

The manifest keeps asset-vs-room storage explicit, so the same behaviour can be
priced once as a reusable asset or once per room.  No production JSON or source
file is modified by this script.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Iterable


POLICIES = {"fixed", "alternate", "playerSide", "flag", "random"}
COORDINATE_MODES = {"absoluteCell", "relativeSpawn", "undecided"}
RUNTIME_STORAGE_MODES = {"resident", "bankedStaged"}
NODE_BYTES = 5
ASSET_COUNT_BYTES = 1
DEFAULTS = {"slotStateBytes": 1}


class PreflightInputError(ValueError):
    """Raised when a manifest is incomplete or contradictory."""


def _mapping(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise PreflightInputError(f"{label} must be an object")
    return value


def _non_negative_int(value: Any, label: str) -> int:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise PreflightInputError(f"{label} must be a non-negative integer")
    if int(value) != value or value < 0:
        raise PreflightInputError(f"{label} must be a non-negative integer")
    return int(value)


def _list(value: Any, label: str) -> list[Any]:
    if not isinstance(value, list):
        raise PreflightInputError(f"{label} must be an array")
    return value


def _resolve_asset_ids(room: dict[str, Any], label: str) -> list[str]:
    raw = _list(room.get("assets", []), f"{label}.assets")
    result: list[str] = []
    for index, value in enumerate(raw):
        if not isinstance(value, str) or not value:
            raise PreflightInputError(f"{label}.assets[{index}] must be a non-empty string")
        result.append(value)
    return result


def _asset_size(asset: dict[str, Any], label: str) -> dict[str, Any]:
    nodes = _list(asset.get("nodes"), f"{label}.nodes")
    if not nodes:
        raise PreflightInputError(f"{label}.nodes must not be empty")

    branch_count = 0
    node_rows: list[dict[str, Any]] = []

    for index, raw_node in enumerate(nodes):
        node = _mapping(raw_node, f"{label}.nodes[{index}]")
        node_label = str(node.get("id", node.get("sequence", index + 1)))
        outputs = _non_negative_int(node.get("outputs", 1), f"{label}.nodes[{index}].outputs")
        if outputs not in (1, 2):
            raise PreflightInputError(
                f"{label}.nodes[{index}].outputs must be 1 or 2, got {outputs}"
            )
        policy = node.get("policy")
        if outputs == 1:
            if policy not in (None, ""):
                raise PreflightInputError(
                    f"{label}.nodes[{index}] has a policy but only one output"
                )
        else:
            branch_count += 1
            policy = "fixed" if policy in (None, "") else policy
            if policy not in POLICIES:
                raise PreflightInputError(
                    f"{label}.nodes[{index}].policy must be one of {sorted(POLICIES)}"
                )
        node_rows.append(
            {
                "id": node_label,
                "outputs": outputs,
                "policy": policy if outputs == 2 else None,
                "bytes": NODE_BYTES,
            }
        )

    return {
        "id": str(asset.get("id", label.rsplit(".", 1)[-1])),
        "nodeCount": len(nodes),
        "branchNodeCount": branch_count,
        "policyBytes": 0,
        "policyBits": branch_count * 3,
        "romBytes": ASSET_COUNT_BYTES + len(node_rows) * NODE_BYTES,
        "nodes": node_rows,
    }


def evaluate(manifest: dict[str, Any]) -> dict[str, Any]:
    manifest = _mapping(manifest, "manifest")
    raw_defaults = _mapping(manifest.get("defaults", {}), "defaults")
    defaults = dict(DEFAULTS)
    for key, value in raw_defaults.items():
        if key not in defaults:
            raise PreflightInputError(f"unknown defaults field: {key}")
        defaults[key] = _non_negative_int(value, f"defaults.{key}")
    if defaults["slotStateBytes"] == 0:
        raise PreflightInputError("defaults.slotStateBytes must be > 0")

    storage_mode = manifest.get("storageMode", "asset")
    if storage_mode not in {"asset", "room"}:
        raise PreflightInputError("storageMode must be 'asset' or 'room'")
    asset_type = manifest.get("assetType", "path_follow")
    if not isinstance(asset_type, str) or not asset_type:
        raise PreflightInputError("assetType must be a non-empty string")
    coordinate_mode = manifest.get("coordinateMode", "absoluteCell")
    if coordinate_mode not in COORDINATE_MODES:
        raise PreflightInputError(
            f"coordinateMode must be one of {sorted(COORDINATE_MODES)}"
        )
    runtime_storage = manifest.get("runtimeStorage", "resident")
    if runtime_storage not in RUNTIME_STORAGE_MODES:
        raise PreflightInputError(
            f"runtimeStorage must be one of {sorted(RUNTIME_STORAGE_MODES)}"
        )

    assets_raw = _list(manifest.get("assets"), "assets")
    rooms_raw = _list(manifest.get("rooms"), "rooms")
    if not assets_raw:
        raise PreflightInputError("assets must be a non-empty array")
    if not rooms_raw:
        raise PreflightInputError("rooms must be a non-empty array")

    assets: dict[str, dict[str, Any]] = {}
    for index, raw_asset in enumerate(assets_raw):
        asset = _mapping(raw_asset, f"assets[{index}]")
        asset_id = asset.get("id")
        if not isinstance(asset_id, str) or not asset_id:
            raise PreflightInputError(f"assets[{index}].id must be a non-empty string")
        if asset_id in assets:
            raise PreflightInputError(f"duplicate asset id: {asset_id}")
        priced = _asset_size(asset, f"assets[{index}]({asset_id})")
        priced["id"] = asset_id
        assets[asset_id] = priced

    room_rows: list[dict[str, Any]] = []
    room_rom_bytes = 0
    max_slots = 0
    intervals: list[int] = []
    max_active_ram = 0
    selected_asset_ids: set[str] = set()
    for index, raw_room in enumerate(rooms_raw):
        room = _mapping(raw_room, f"rooms[{index}]")
        room_id = str(room.get("id", f"room{index}"))
        active_slots = _non_negative_int(
            room.get("activeSlots", 0), f"rooms[{index}].activeSlots"
        )
        interval = _non_negative_int(
            room.get("logicInterval", 1), f"rooms[{index}].logicInterval"
        )
        if interval == 0:
            raise PreflightInputError(f"rooms[{index}].logicInterval must be > 0")
        asset_ids = _resolve_asset_ids(room, f"rooms[{index}]({room_id})")
        if not asset_ids:
            raise PreflightInputError(f"rooms[{index}]({room_id}) must reference at least one asset")
        unknown = [asset_id for asset_id in asset_ids if asset_id not in assets]
        if unknown:
            raise PreflightInputError(
                f"rooms[{index}]({room_id}) references unknown assets: {unknown}"
            )

        room_bytes = sum(assets[asset_id]["romBytes"] for asset_id in asset_ids)
        branch_count = sum(assets[asset_id]["branchNodeCount"] for asset_id in asset_ids)
        node_count = sum(assets[asset_id]["nodeCount"] for asset_id in asset_ids)
        room_rom_bytes += room_bytes
        selected_asset_ids.update(asset_ids)
        max_slots = max(max_slots, active_slots)
        intervals.append(interval)
        active_ram = active_slots * defaults["slotStateBytes"]
        max_active_ram = max(max_active_ram, active_ram)
        room_rows.append(
            {
                "id": room_id,
                "assets": asset_ids,
                "nodeCount": node_count,
                "branchNodeCount": branch_count,
                "romBytes": room_bytes,
                "activeSlots": active_slots,
                "activeTriggerRamBytes": active_ram,
                "logicInterval": interval,
            }
        )

    asset_rom_bytes = sum(assets[asset_id]["romBytes"] for asset_id in selected_asset_ids)
    selected_rom_bytes = asset_rom_bytes if storage_mode == "asset" else room_rom_bytes
    selected_source = "unique referenced assets" if storage_mode == "asset" else "room references"
    room_branch_node_count = sum(row["branchNodeCount"] for row in room_rows)
    room_node_count = sum(row["nodeCount"] for row in room_rows)
    unique_branch_node_count = sum(
        assets[asset_id]["branchNodeCount"] for asset_id in selected_asset_ids
    )
    unique_node_count = sum(assets[asset_id]["nodeCount"] for asset_id in selected_asset_ids)
    # Policies occupy the high bits of the action byte; they add no ROM bytes.
    asset_policy_bytes = 0
    room_policy_bytes = 0
    selected_node_count = unique_node_count if storage_mode == "asset" else room_node_count
    selected_branch_node_count = (
        unique_branch_node_count if storage_mode == "asset" else room_branch_node_count
    )
    selected_policy_bytes = asset_policy_bytes if storage_mode == "asset" else room_policy_bytes

    errors: list[str] = []
    warnings: list[str] = []
    if runtime_storage != "resident":
        errors.append(
            "runtimeStorage=bankedStaged is not supported by the live walker; "
            "path_follow program bytes must remain resident, or the loader/walker "
            "contract must be changed together."
        )
    if coordinate_mode == "undecided":
        warnings.append(
            "coordinateMode is undecided; absolute-cell and relative-spawn "
            "interpretations have identical byte cost but different runtime meaning."
        )
    cost_model = manifest.get("estimatedTStatesPerCheck")
    if cost_model is None:
        warnings.append(
            "estimatedTStatesPerCheck is not supplied; ROM/RAM budget is valid, "
            "but CPU cost remains an explicit input rather than an invented estimate."
        )
    elif not isinstance(cost_model, dict):
        raise PreflightInputError("estimatedTStatesPerCheck must be an object when supplied")

    resident = _mapping(manifest.get("resident", {}), "resident")
    actual_free = resident.get("actualFreeBytes")
    min_actual_resident_free = None
    if actual_free is not None:
        min_actual_resident_free = _non_negative_int(
            actual_free, "resident.actualFreeBytes"
        )

    if min_actual_resident_free is None:
        warnings.append(
            "minActualResidentFree is unavailable; no resident-headroom gate was applied."
        )

    result = {
        "scope": "msx2_enemy_trigger_preflight",
        "status": "error" if errors else ("incomplete" if warnings else "ok"),
        "assetType": asset_type,
        "storageMode": storage_mode,
        "coordinateMode": coordinate_mode,
        "runtimeStorage": runtime_storage,
        "storageModeSelectedRomBytes": selected_rom_bytes,
        "storageModeSelectedRomSource": selected_source,
        "assetRomBytes": asset_rom_bytes,
        "roomRomBytes": room_rom_bytes,
        "activeTriggerRamBytes": max_active_ram,
        "activeGraphRamBytes": 0,
        "maxConcurrentPathSlots": max_slots,
        "logicInterval": min(intervals),
        "nodeCount": selected_node_count,
        "branchNodeCount": selected_branch_node_count,
        "assetNodeCount": unique_node_count,
        "assetBranchNodeCount": unique_branch_node_count,
        "roomNodeCount": room_node_count,
        "roomBranchNodeCount": room_branch_node_count,
        "uniqueReferencedNodeCount": unique_node_count,
        "uniqueReferencedBranchNodeCount": unique_branch_node_count,
        "assetPolicyBytes": asset_policy_bytes,
        "roomPolicyBytes": room_policy_bytes,
        "policyBytes": selected_policy_bytes,
        "estimatedTStatesPerCheck": cost_model,
        "minActualResidentFree": min_actual_resident_free,
        "recordModel": {
            "nodeBytes": NODE_BYTES,
            "assetCountBytes": ASSET_COUNT_BYTES,
            "actionOpcodeBits": 5,
            "branchPolicyBits": 3,
            "slotStateBytes": defaults["slotStateBytes"],
            "sequenceNumberBytes": 0,
            "coordinateBytes": 1,
        },
        "assets": [assets[asset_id] for asset_id in sorted(selected_asset_ids)],
        "rooms": room_rows,
        "errors": errors,
        "warnings": warnings,
    }
    return result


def _self_test() -> None:
    manifest = {
        "storageMode": "asset",
        "assetType": "path_follow",
        "coordinateMode": "absoluteCell",
        "resident": {"actualFreeBytes": 256},
        "assets": [
            {
                "id": "behaviourA",
                "nodes": [
                    {"id": "1", "outputs": 1},
                    {"id": "3", "outputs": 2, "policy": "random"},
                ],
            }
        ],
        "rooms": [
            {"id": "room0", "assets": ["behaviourA"], "activeSlots": 4, "logicInterval": 2},
            {"id": "room1", "assets": ["behaviourA"], "activeSlots": 1, "logicInterval": 3},
        ],
        "estimatedTStatesPerCheck": {"sameCell": 18, "cellChange": 49},
    }
    result = evaluate(manifest)
    assert result["status"] == "ok"
    assert result["assetRomBytes"] == 11
    assert result["roomRomBytes"] == 22
    assert result["storageModeSelectedRomBytes"] == 11
    assert result["activeTriggerRamBytes"] == 4
    assert result["activeGraphRamBytes"] == 0
    assert result["maxConcurrentPathSlots"] == 4
    assert result["logicInterval"] == 2
    assert result["recordModel"]["nodeBytes"] == 5
    assert result["recordModel"]["assetCountBytes"] == 1
    assert result["recordModel"]["branchPolicyBits"] == 3
    assert result["recordModel"]["sequenceNumberBytes"] == 0

    room_result = evaluate({**manifest, "storageMode": "room"})
    assert room_result["storageModeSelectedRomBytes"] == 22


def _read_json(value: str) -> dict[str, Any]:
    if value == "-":
        raw = sys.stdin.read()
        source = "stdin"
    else:
        source = value
        try:
            raw = Path(value).read_text(encoding="utf-8")
        except OSError as exc:
            raise PreflightInputError(f"cannot read manifest {value}: {exc}") from exc
    try:
        return _mapping(json.loads(raw), source)
    except json.JSONDecodeError as exc:
        raise PreflightInputError(f"invalid JSON in {source}: {exc}") from exc


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", help="JSON manifest path, or '-' for stdin")
    parser.add_argument("--self-test", action="store_true", help="run formula self-tests")
    parser.add_argument("--pretty", action="store_true", help="pretty-print JSON output")
    args = parser.parse_args(list(argv) if argv is not None else None)

    try:
        if args.self_test:
            _self_test()
            print(json.dumps({"scope": "msx2_enemy_trigger_preflight", "status": "self-test-ok"}))
            return 0
        if not args.manifest:
            parser.error("--manifest is required unless --self-test is used")
        result = evaluate(_read_json(args.manifest))
    except PreflightInputError as exc:
        print(json.dumps({"scope": "msx2_enemy_trigger_preflight", "status": "error", "errors": [str(exc)]}))
        return 2

    print(json.dumps(result, indent=2 if args.pretty else None, sort_keys=True))
    return 1 if result["status"] == "error" else 0


if __name__ == "__main__":
    raise SystemExit(main())
