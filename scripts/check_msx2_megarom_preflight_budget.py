#!/usr/bin/env python3
"""Unit-style checks for the MSX2 MegaROM pre-Glass budget gate."""

from __future__ import annotations

import json
import copy
import sys
import tempfile
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path

sys.dont_write_bytecode = True

from build_mideas_unified_rom import (
    build_preflight_artifact_summaries,
    describe_glass_compile_failure,
    validate_msx2_preflight_with_safe_resolution,
    validate_msx2_screen4_megarom_preflight_budget,
    write_msx2_build_summary,
    write_msx2_compile_failure_summary,
)


def make_ram_budget(status: str = "ok", free_bytes: int = 12000) -> dict:
    used_bytes = 13056 - free_bytes
    return {
        "scope": "msx2_screen4_ram_budget",
        "start": "#C000",
        "end": "#C314",
        "limit": "#F300",
        "usableBytes": 13056,
        "usedBytes": used_bytes,
        "freeBytes": free_bytes,
        "warningThresholdBytes": 11097,
        "maxPersistentScreens": 65,
        "reachableScreens": 1,
        "status": status,
        "sections": [
            {"id": "runtime.persistent_effect_layers", "start": "#C080", "end": "#C140", "bytes": 192},
            {"id": "runtime.effects_scratch", "start": "#C200", "end": "#C2C0", "bytes": 192},
            {"id": "runtime.collision_current_cache", "start": "#C2C0", "end": "#C380", "bytes": 192, "cacheScope": "current_screen"},
            {"id": "runtime.behavior_current_cache", "start": "#C380", "end": "#C440", "bytes": 192, "cacheScope": "current_screen"},
            {"id": "runtime.enemy_pool", "start": "#C440", "end": "#C494", "bytes": 84},
        ],
        "recommendations": [{
            "severity": "error" if status == "error" else "ok",
            "target": "runtimeRam",
            "reason": "Runtime RAM exceeds limit." if status == "error" else "Estimated runtime RAM fits below warning threshold.",
            "action": "Reduce mutable runtime RAM." if status == "error" else "No RAM recovery needed.",
        }],
    }


def ensure_split_chunk_manifest(logical_budget: dict) -> None:
    split_packages = logical_budget.get("splitPackages")
    if not isinstance(split_packages, list) or not split_packages:
        return
    if isinstance(logical_budget.get("splitChunkManifest"), list) and logical_budget.get("splitChunkManifest"):
        return
    manifest = []
    for index, package in enumerate(split_packages):
        if not isinstance(package, dict):
            continue
        chunk_id = str(package.get("id") or package.get("chunkId") or f"chunk{index:02d}")
        source_id = str(package.get("sourceId") or package.get("splitFrom") or chunk_id).replace(".", "_").replace("#", "_")
        label_stem = f"TEST_{source_id.upper()}_{index:02d}"
        manifest.append({
            "chunkId": chunk_id,
            "splitFrom": package.get("splitFrom") or chunk_id.split("#", 1)[0],
            "type": package.get("type") or "msx2screen",
            "sourceId": package.get("sourceId") or source_id,
            "splitIndex": int(package.get("splitIndex") or index),
            "splitCount": int(package.get("splitCount") or len(split_packages)),
            "splitStrategy": package.get("splitStrategy") or "auto_world_package_chunk",
            "usedBytes": int(package.get("usedBytes") or 0),
            "recommendedBankClass": package.get("recommendedBankClass") or "world.screen",
            "screenLabel": f"TEST_{source_id.upper()}",
            "payloadKind": "mixed_screen4_payload",
            "payloadLabels": [
                f"TEST_{source_id.upper()}_BANK_0_PATTERNS",
                f"TEST_{source_id.upper()}_BANK_0_COLORS",
                f"TEST_{source_id.upper()}_NAMES",
            ],
            "payloadBytes": 4864,
            "payloadLabelCount": 3,
            "loaderCoverageStatus": "covered",
            "loaderCoveredPayloadLabels": [
                f"TEST_{source_id.upper()}_BANK_0_PATTERNS",
                f"TEST_{source_id.upper()}_BANK_0_COLORS",
                f"TEST_{source_id.upper()}_NAMES",
            ],
            "loaderUncoveredPayloadLabels": [],
            "payloadParts": [
                {"label": f"TEST_{source_id.upper()}_BANK_0_PATTERNS", "kind": "screen4_patterns", "rawBytes": 2048, "loadOrder": 0},
                {"label": f"TEST_{source_id.upper()}_BANK_0_COLORS", "kind": "screen4_colors", "rawBytes": 2048, "loadOrder": 1},
                {"label": f"TEST_{source_id.upper()}_NAMES", "kind": "screen4_names", "rawBytes": 768, "loadOrder": 20},
            ],
            "windowAddress": "#8000",
            "labelStem": label_stem,
            "dataLabel": f"{label_stem}_DATA",
            "dataEndLabel": f"{label_stem}_DATA_END",
            "dataBankSymbol": f"{label_stem}_DATA_BANK",
            "loaderSymbol": f"load_{label_stem.lower()}_chunk",
        })
    logical_budget["splitChunkManifest"] = manifest


def ensure_screen_storage_parts(storage_policy: list[dict]) -> None:
    for policy in storage_policy:
        if policy.get("type") != "msx2screen" or isinstance(policy.get("parts"), list):
            continue
        raw_bytes = int(policy.get("rawBytes") or policy.get("storedBytesEstimate") or 0)
        policy["parts"] = [
            {
                "name": "graphicsAndNameTables",
                "rawBytes": max(0, raw_bytes - 576),
                "accessPattern": "load_to_vram",
                "decision": "ROM_ZX0_CANDIDATE_TO_VRAM",
            },
            {
                "name": "runtimeLayersAndSpawns",
                "rawBytes": min(raw_bytes, 576),
                "accessPattern": "runtime_read",
                "decision": "ROM_RAW",
                "placement": "world_data_bank",
                "runtimePlacement": "ram_cache_for_collision_behavior_and_persistent_ram_for_effects",
            },
        ]


def write_artifacts(
    artifact_dir: Path,
    logical_budget: dict,
    storage_policy: list[dict],
    ram_budget: dict | None = None,
    world_package_summary: list[dict] | None = None,
) -> None:
    if ram_budget is None:
        ram_budget = make_ram_budget()
    ensure_split_chunk_manifest(logical_budget)
    ensure_screen_storage_parts(storage_policy)
    if world_package_summary is None:
        world_package_summary = [{
            "worldId": "world_test",
            "assetCount": 1,
            "screenCount": 1,
            "estimatedBytes": 0,
            "estimated8kBanks": 1,
            "bankClassBytes": [],
        }]
        for policy in storage_policy:
            if policy.get("decision") == "INHERIT_OWNER_SCREEN_POLICY":
                continue
            policy["ownerWorldIds"] = ["world_test"]
            stored_bytes = int(policy.get("storedBytesEstimate") or 0)
            world_package_summary[0]["estimatedBytes"] += stored_bytes
            world_package_summary[0]["bankClassBytes"].append({"id": "world.screen", "usedBytes": stored_bytes})
    physical_bank_by_package = {}
    for bank in logical_budget.get("estimatedPackedBanks") or []:
        for package in bank.get("packages") or []:
            physical_bank_by_package[package.get("id")] = bank.get("bankIndex", 0)
    manifest_worlds = []
    for world_summary in world_package_summary:
        world_id = world_summary["worldId"]
        packages = []
        for policy in storage_policy:
            if policy.get("decision") == "INHERIT_OWNER_SCREEN_POLICY":
                continue
            if world_id not in (policy.get("ownerWorldIds") or []):
                continue
            package_id = f"{policy.get('type')}.{policy.get('id')}"
            packages.append({
                "packageId": package_id,
                "type": policy.get("type"),
                "sourceId": policy.get("id"),
                "logicalSection": "world screens",
                "recommendedBankClass": "world.screen",
                "physicalBankIndex": physical_bank_by_package.get(package_id),
                "windowAddress": "#8000",
                "bankSizeBytes": 8192,
                "rawBytes": int(policy.get("rawBytes") or 0),
                "storedBytes": int(policy.get("storedBytesEstimate") or 0),
                "decision": policy.get("decision", "ROM_RAW"),
                "placementReason": "Estimated first-fit-decreasing placement before final compression and allocator pass.",
            })
        manifest_worlds.append({
            "worldId": world_id,
            "estimatedBytes": int(world_summary.get("estimatedBytes") or 0),
            "estimated8kBanks": int(world_summary.get("estimated8kBanks") or 1),
            "packages": packages,
        })
    world_bank_manifest = {
        "scope": "msx2_screen4_world_bank_manifest",
        "mapper": "konami",
        "bankSizeBytes": 8192,
        "dataWindowAddress": "#8000",
        "estimatedPhysicalBanks": [
            {
                "bankIndex": int(bank.get("bankIndex") or 0),
                "windowAddress": "#8000",
                "bankSizeBytes": 8192,
                "warningThresholdBytes": int(bank.get("warningThresholdBytes") or 7372),
                "usedBytes": int(bank.get("usedBytes") or 0),
                "freeBytes": int(bank.get("freeBytes") or 0),
                "usedPercent": float(bank.get("usedPercent") or 0),
                "warning": bool(bank.get("warning")),
                "overBudgetBytes": int(bank.get("overBudgetBytes") or 0),
                "status": bank.get("status") or ("error" if int(bank.get("overBudgetBytes") or 0) > 0 else "warning" if bank.get("warning") else "ok"),
                "packages": bank.get("packages") or [],
            }
            for bank in logical_budget.get("estimatedPackedBanks") or []
        ],
        "worlds": manifest_worlds,
    }
    estimated_count = int(logical_budget.get("estimatedPackedBankCount") or len(logical_budget.get("estimatedPackedBanks") or []) or 1)
    split_packages = logical_budget.get("splitPackages") or []
    screen4_data_bank_plan = {
        "supported": estimated_count <= 1 or not split_packages,
        "bankCount": estimated_count,
        "dataWindowAddress": "#8000",
        "unsupportedReason": "split_packages_require_physical_chunk_labels" if split_packages else None,
        "splitChunkCount": len(logical_budget.get("splitChunkManifest") or []),
        "splitChunkManifest": logical_budget.get("splitChunkManifest") or [],
        "screenBanks": [
            {
                "label": str(policy.get("id") or ""),
                "packageId": f"{policy.get('type')}.{policy.get('id')}",
                "bankIndex": physical_bank_by_package.get(f"{policy.get('type')}.{policy.get('id')}", 0),
                "physicalBank": 4 + int(physical_bank_by_package.get(f"{policy.get('type')}.{policy.get('id')}", 0) or 0),
            }
            for policy in storage_policy
            if policy.get("type") == "msx2screen"
        ],
    }
    project_slice = {
        "scope": "msx2_screen4_project_slice",
        "entryPoints": {"worldIds": [item["worldId"] for item in world_package_summary]},
        "includedRuntimeModules": ["runtime.msx2.boot", "runtime.msx2.screen4.vdp"],
        "includedRuntimeModuleDetails": [
            {
                "id": "runtime.msx2.boot",
                "placement": "resident",
                "reason": "Required by every native MSX2 SCREEN 4 build",
            },
            {
                "id": "runtime.msx2.screen4.vdp",
                "placement": "resident",
                "reason": "Required by every native MSX2 SCREEN 4 build",
            },
        ],
        "excludedRuntimeModules": [
            {
                "id": "runtime.msx2.world_special_code",
                "placement": "world_specific",
                "reason": "No world-specific behavior module is referenced by this fixture",
            },
            {
                "id": "runtime.msx2.optional_far_code",
                "placement": "far_code",
                "reason": "No optional far-code runtime is referenced by this fixture",
            },
        ],
        "worldPackageSummary": world_package_summary,
        "worldBankManifest": world_bank_manifest,
        "screen4DataBankPlan": screen4_data_bank_plan,
        "screen4RuntimeLayerPolicy": {
            "collision": {
                "definitionPlacement": "world_data_bank",
                "runtimePlacement": "ram_cache",
                "cacheScope": "current_screen",
                "bytesPerScreen": 192,
            },
            "behavior": {
                "definitionPlacement": "world_data_bank",
                "runtimePlacement": "ram_cache",
                "cacheScope": "current_screen",
                "bytesPerScreen": 192,
            },
            "effects": {
                "definitionPlacement": "world_data_bank",
                "runtimePlacement": "persistent_ram",
                "cacheScope": "per_screen",
                "bytesPerScreen": 192,
            },
        },
        "assetStoragePolicy": storage_policy,
        "logicalBankBudget": logical_budget,
        "ramBudget": ram_budget,
    }
    artifact_dir.mkdir(parents=True, exist_ok=True)
    (artifact_dir / "project_slice.json").write_text(json.dumps(project_slice, indent=2) + "\n", encoding="utf-8")
    (artifact_dir / "asset_storage_policy.json").write_text(json.dumps(storage_policy, indent=2) + "\n", encoding="utf-8")
    (artifact_dir / "logical_bank_budget.json").write_text(json.dumps(logical_budget, indent=2) + "\n", encoding="utf-8")
    (artifact_dir / "msx2_world_bank_manifest.json").write_text(json.dumps(world_bank_manifest, indent=2) + "\n", encoding="utf-8")
    (artifact_dir / "ram_budget.json").write_text(json.dumps(ram_budget, indent=2) + "\n", encoding="utf-8")


def make_budget(package_bytes: int, over_budget: bool = False) -> dict:
    package = {
        "id": "msx2screen.test_room",
        "type": "msx2screen",
        "sourceId": "test_room",
        "recommendedBankClass": "world.screen",
        "usedBytes": package_bytes,
        "freeBytesIfAlone": max(0, 8192 - package_bytes),
        "warning": package_bytes >= 7372,
        "overBudgetBytes": max(0, package_bytes - 8192),
        "canSplit": True,
    }
    packed_bank = {
        "bankIndex": 0,
        "bankSizeBytes": 8192,
        "warningThresholdBytes": 7372,
        "usedBytes": min(package_bytes, 8192),
        "freeBytes": max(0, 8192 - package_bytes),
        "usedPercent": round((package_bytes / 8192) * 100, 2),
        "warning": package_bytes >= 7372,
        "overBudgetBytes": max(0, package_bytes - 8192),
        "status": "error" if package_bytes > 8192 else "warning" if package_bytes >= 7372 else "ok",
        "packages": [{"id": package["id"], "usedBytes": package_bytes, "recommendedBankClass": "world.screen"}],
    }
    recommendations = [{
        "severity": "error" if over_budget else "ok",
        "target": package["id"] if over_budget else "logicalBankBudget",
        "reason": "Package exceeds one 8 KB bank." if over_budget else "All estimated packages fit below warning threshold.",
        "action": "Split this logical package." if over_budget else "No recovery needed before the final allocator pass.",
    }]
    bank_class_summary = [{
        "id": "world.screen",
        "packageCount": 1,
        "usedBytes": package_bytes,
        "estimatedMinimumBanks": 1 if package_bytes <= 8192 else 2,
        "warningPackageCount": 1 if package["warning"] else 0,
        "overBudgetPackageCount": 1 if package["overBudgetBytes"] else 0,
        "largestPackage": {"id": package["id"], "usedBytes": package_bytes},
    }]
    recovery_plan = [
        {"order": 1, "id": "repack_final_sizes", "status": "recommended" if package["warning"] else "not_needed", "trigger": "bank pressure", "appliesTo": ["bank0"] if package["warning"] else [], "action": "Re-run first-fit-decreasing with final stored sizes."},
        {"order": 2, "id": "split_world_packages", "status": "required" if over_budget else "not_needed", "trigger": "large splittable package", "appliesTo": [package["id"]] if over_budget else [], "action": "Split the logical world package across additional physical world data banks."},
        {"order": 3, "id": "move_cold_readonly_data", "status": "not_needed", "trigger": "resident pressure", "appliesTo": [], "action": "Move cold read-only tables to world data banks."},
        {"order": 4, "id": "selective_zx0", "status": "recommended" if package["warning"] else "not_needed", "trigger": "large load-to-VRAM data", "appliesTo": [package["id"]] if package["warning"] else [], "action": "Try ZX0 only for large load-to-VRAM resources."},
        {"order": 5, "id": "keep_hot_runtime_raw", "status": "enforced", "trigger": "hot runtime table", "appliesTo": ["runtime lookup tables"], "action": "Keep hot per-frame tables raw."},
        {"order": 6, "id": "world_special_code_bank", "status": "not_needed", "trigger": "rare behavior pressure", "appliesTo": [], "action": "Move rare behavior behind a world special-code bank."},
        {"order": 7, "id": "split_large_payload_chunks", "status": "required" if over_budget else "not_needed", "trigger": "single payload cannot fit one mapper window", "appliesTo": [package["id"]] if over_budget else [], "action": "Split large payloads into loader-addressable chunks."},
        {"order": 8, "id": "fail_actionable_report", "status": "required" if over_budget else "ready", "trigger": "recovery still leaves over-budget unit", "appliesTo": [package["id"]] if over_budget else [], "action": "Fail before Glass with largest contributors."},
    ]
    return {
        "bankSizeBytes": 8192,
        "warningThresholdBytes": 7372,
        "totalPayloadBytes": package_bytes,
        "estimatedMinimumBanks": 1 if package_bytes <= 8192 else 2,
        "estimatedPackedBankCount": 1,
        "estimatedPackedBanks": [packed_bank],
        "overBudgetPackages": [package] if over_budget else [],
        "warningPackages": [package] if package["warning"] else [],
        "warningPackedBanks": [packed_bank] if packed_bank["warning"] else [],
        "bankClassSummary": bank_class_summary,
        "recoveryRecommendations": recommendations,
        "recoveryPlan": recovery_plan,
        "packages": [package],
    }


def expect_failure(artifact_dir: Path, expected_text: str, strict_warnings: bool = False) -> None:
    try:
        validate_msx2_screen4_megarom_preflight_budget(artifact_dir, strict_warnings=strict_warnings)
    except RuntimeError as exc:
        if expected_text not in str(exc):
            raise AssertionError(f"Expected {expected_text!r} in preflight error, got: {exc}") from exc
        return
    raise AssertionError("Expected MSX2 MegaROM preflight to fail")


def rewrite_budget_artifacts(artifact_dir: Path, project_slice: dict, logical_budget: dict) -> None:
    project_slice["logicalBankBudget"] = logical_budget
    if isinstance(project_slice.get("screen4DataBankPlan"), dict):
        project_slice["screen4DataBankPlan"]["splitChunkCount"] = len(logical_budget.get("splitChunkManifest") or [])
        project_slice["screen4DataBankPlan"]["splitChunkManifest"] = logical_budget.get("splitChunkManifest") or []
    (artifact_dir / "project_slice.json").write_text(json.dumps(project_slice, indent=2) + "\n", encoding="utf-8")
    (artifact_dir / "logical_bank_budget.json").write_text(json.dumps(logical_budget, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    storage_policy = [{
        "type": "msx2screen",
        "id": "test_room",
        "name": "Test Room",
        "rawBytes": 4096,
        "storedBytesEstimate": 4096,
        "accessPattern": "mixed_load_to_vram_and_runtime_read",
        "mutable": False,
        "decision": "MIXED_ROM_RAW_TO_VRAM_AND_ROM_RAW",
    }]

    with tempfile.TemporaryDirectory(prefix="mideas_msx2_preflight_") as tmp:
        root = Path(tmp)

        ok_dir = root / "ok_generated"
        write_artifacts(ok_dir, make_budget(4096), storage_policy)
        output = StringIO()
        with redirect_stdout(output):
            validate_msx2_screen4_megarom_preflight_budget(ok_dir)
        summary = output.getvalue()
        if "MSX2 MegaROM preflight:" not in summary or "payload=4096 bytes" not in summary:
            raise AssertionError(f"Preflight summary was not printed as expected: {summary!r}")
        if "MSX2 MegaROM preflight classes:" not in summary or "world.screen=4096 bytes/1 pkg" not in summary:
            raise AssertionError(f"Preflight class summary was not printed as expected: {summary!r}")
        if "MSX2 MegaROM preflight worlds:" not in summary or "world_test=4096 bytes/1 screens" not in summary:
            raise AssertionError(f"Preflight world summary was not printed as expected: {summary!r}")
        if "MSX2 RAM preflight:" not in summary or "free=12000 bytes" not in summary:
            raise AssertionError(f"RAM preflight summary was not printed as expected: {summary!r}")
        preflight_summary_path = ok_dir / "preflight_summary.json"
        if not preflight_summary_path.exists():
            raise AssertionError("preflight_summary.json was not written for a passing MSX2 preflight")
        preflight_summary = json.loads(preflight_summary_path.read_text(encoding="utf-8"))
        if preflight_summary.get("scope") != "msx2_screen4_megarom_preflight_summary":
            raise AssertionError(f"Unexpected preflight summary scope: {preflight_summary.get('scope')!r}")
        if preflight_summary.get("status") != "ok":
            raise AssertionError(f"Unexpected preflight summary status: {preflight_summary.get('status')!r}")
        if preflight_summary.get("rom", {}).get("payloadBytes") != 4096:
            raise AssertionError(f"Unexpected ROM payload summary: {preflight_summary.get('rom')!r}")
        if preflight_summary.get("rom", {}).get("bankClassSummary") != make_budget(4096)["bankClassSummary"]:
            raise AssertionError(f"Unexpected bank class summary: {preflight_summary.get('rom')!r}")
        if preflight_summary.get("worldPackages", [{}])[0].get("estimatedBytes") != 4096:
            raise AssertionError(f"Unexpected world package summary: {preflight_summary.get('worldPackages')!r}")
        if preflight_summary.get("planB", {}).get("recoveryPlan") != make_budget(4096)["recoveryPlan"]:
            raise AssertionError(f"Unexpected recovery plan: {preflight_summary.get('planB')!r}")
        artifact_checks = preflight_summary.get("artifactChecks")
        if not isinstance(artifact_checks, list) or len(artifact_checks) != 5:
            raise AssertionError(f"Unexpected artifact checks: {artifact_checks!r}")
        artifact_names = {item.get("name") for item in artifact_checks if isinstance(item, dict)}
        if artifact_names != {"project_slice.json", "asset_storage_policy.json", "logical_bank_budget.json", "msx2_world_bank_manifest.json", "ram_budget.json"}:
            raise AssertionError(f"Unexpected artifact check names: {artifact_checks!r}")
        for artifact_check in artifact_checks:
            if not isinstance(artifact_check, dict) or int(artifact_check.get("bytes") or 0) <= 0:
                raise AssertionError(f"Invalid artifact check byte count: {artifact_check!r}")
            if not str(artifact_check.get("checksum") or "").startswith("fnv1a32:"):
                raise AssertionError(f"Invalid artifact check checksum: {artifact_check!r}")
        expected_artifact_checks = build_preflight_artifact_summaries([
            ("project_slice.json", ok_dir / "project_slice.json"),
            ("asset_storage_policy.json", ok_dir / "asset_storage_policy.json"),
            ("logical_bank_budget.json", ok_dir / "logical_bank_budget.json"),
            ("msx2_world_bank_manifest.json", ok_dir / "msx2_world_bank_manifest.json"),
            ("ram_budget.json", ok_dir / "ram_budget.json"),
        ])
        if artifact_checks != expected_artifact_checks:
            raise AssertionError(
                "Preflight input artifact checks do not match the generated files: "
                f"{artifact_checks!r} != {expected_artifact_checks!r}"
            )
        output_artifact_checks = preflight_summary.get("outputArtifactChecks")
        if not isinstance(output_artifact_checks, list) or len(output_artifact_checks) != 1:
            raise AssertionError(f"Unexpected preflight output artifact checks: {output_artifact_checks!r}")
        ide_output_check = output_artifact_checks[0]
        if ide_output_check.get("name") != "msx2_ide_budget_feedback.json":
            raise AssertionError(f"Unexpected preflight output artifact check: {ide_output_check!r}")
        if int(ide_output_check.get("bytes") or 0) <= 0:
            raise AssertionError(f"Invalid IDE output artifact byte count: {ide_output_check!r}")
        if not str(ide_output_check.get("checksum") or "").startswith("fnv1a32:"):
            raise AssertionError(f"Invalid IDE output artifact checksum: {ide_output_check!r}")
        expected_ide_output_check = build_preflight_artifact_summaries([
            ("msx2_ide_budget_feedback.json", ok_dir / "msx2_ide_budget_feedback.json")
        ])[0]
        if ide_output_check != expected_ide_output_check:
            raise AssertionError(
                "Preflight IDE output artifact check does not match the generated file: "
                f"{ide_output_check!r} != {expected_ide_output_check!r}"
            )
        pipeline_gates = preflight_summary.get("pipelineGates")
        if not isinstance(pipeline_gates, list) or len(pipeline_gates) != 11:
            raise AssertionError(f"Unexpected pipeline gate summary: {pipeline_gates!r}")
        expected_gate_ids = [
            "project_analysis_and_world_package_extraction",
            "project_precompilation_slice",
            "asset_storage_policy",
            "ram_budget_report",
            "bank_allocation_dry_run",
            "overflow_recovery_plan",
            "asm_generation",
            "glass_compile",
            "artifact_validation_against_symbols",
            "post_compilation_optimization",
            "openmsx_smoke",
        ]
        actual_gate_ids = [item.get("id") for item in pipeline_gates if isinstance(item, dict)]
        if actual_gate_ids != expected_gate_ids:
            raise AssertionError(f"Unexpected pipeline gate order: {pipeline_gates!r}")
        if any(item.get("status") != "passed" for item in pipeline_gates[:6] if isinstance(item, dict)):
            raise AssertionError(f"Preflight pipeline gates should be marked passed: {pipeline_gates!r}")
        if pipeline_gates[7].get("status") != "pending":
            raise AssertionError(f"Glass gate should still be pending at preflight: {pipeline_gates!r}")
        if preflight_summary.get("ram", {}).get("freeBytes") != 12000:
            raise AssertionError(f"Unexpected RAM free summary: {preflight_summary.get('ram')!r}")
        ide_feedback_path = ok_dir / "msx2_ide_budget_feedback.json"
        if not ide_feedback_path.exists():
            raise AssertionError("msx2_ide_budget_feedback.json was not written for a passing MSX2 preflight")
        ide_feedback = json.loads(ide_feedback_path.read_text(encoding="utf-8"))
        if ide_feedback.get("scope") != "msx2_screen4_ide_budget_feedback":
            raise AssertionError(f"Unexpected IDE feedback scope: {ide_feedback.get('scope')!r}")
        if ide_feedback.get("status") != "ok":
            raise AssertionError(f"Unexpected IDE feedback status: {ide_feedback.get('status')!r}")
        if (ide_feedback.get("rom") or {}).get("bankClassSummary") != make_budget(4096)["bankClassSummary"]:
            raise AssertionError(f"IDE feedback did not expose bank class summary: {ide_feedback.get('rom')!r}")
        if (ide_feedback.get("ram") or {}).get("freeBytes") != 12000:
            raise AssertionError(f"IDE feedback did not expose RAM summary: {ide_feedback.get('ram')!r}")
        if (ide_feedback.get("worldPackages") or [{}])[0].get("estimatedBytes") != 4096:
            raise AssertionError(f"IDE feedback did not expose world package summary: {ide_feedback.get('worldPackages')!r}")
        if not (ide_feedback.get("largestAssets") or []):
            raise AssertionError(f"IDE feedback did not expose largest assets: {ide_feedback!r}")
        if not isinstance(ide_feedback.get("suggestedFixes"), list):
            raise AssertionError(f"IDE feedback did not expose suggested fixes: {ide_feedback!r}")

        manifest_mismatch_dir = root / "manifest_mismatch_generated"
        write_artifacts(manifest_mismatch_dir, make_budget(4096), storage_policy)
        manifest_path = manifest_mismatch_dir / "msx2_world_bank_manifest.json"
        project_slice_path = manifest_mismatch_dir / "project_slice.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["estimatedPhysicalBanks"][0]["usedBytes"] += 1
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        project_slice = json.loads(project_slice_path.read_text(encoding="utf-8"))
        project_slice["worldBankManifest"] = manifest
        project_slice_path.write_text(json.dumps(project_slice, indent=2) + "\n", encoding="utf-8")
        try:
            validate_msx2_screen4_megarom_preflight_budget(manifest_mismatch_dir)
            raise AssertionError("Expected preflight failure for worldBankManifest/logicalBankBudget bank mismatch")
        except RuntimeError as exc:
            if "worldBankManifest bank 0 usedBytes differs from logicalBankBudget" not in str(exc):
                raise AssertionError(f"Unexpected manifest mismatch failure: {exc}") from exc

        rom_path = ok_dir / "test.rom"
        asm_path = ok_dir / "test.asm"
        sym_path = ok_dir / "test.sym"
        post_asm_report_path = ok_dir / "test.post-asm-report.json"
        rom_path.write_bytes(b"AB" + bytes([0xFF]) * 8190)
        asm_path.write_text("; synthetic asm\n", encoding="utf-8")
        sym_path.write_text("START: 4000\n", encoding="utf-8")
        post_asm_report_path.write_text(
            json.dumps({
                "input": str(asm_path),
                "metrics": {
                    "block_inventory": {
                        "dead_block_candidates": 2,
                        "dead_candidate_lines": 12,
                        "dead_candidate_source_bytes": 384,
                    },
                    "optimization_summary": {
                        "passes_run": 1,
                        "removed_lines": 4,
                        "removed_source_bytes": 128,
                    },
                },
                "findings": [{"rule_id": "unit"}],
                "applied_patches": 1,
            }),
            encoding="utf-8",
        )
        write_msx2_build_summary(
            artifact_dir=ok_dir,
            rom_output=rom_path,
            asm_to_compile=asm_path,
            sym_output=sym_path,
            original_size=8192,
            padded_size=8192,
            validation_kind="unit_test",
            post_asm_requested=True,
            post_asm_check_only=True,
            post_asm_applied=False,
            post_asm_report_paths=[post_asm_report_path],
            openmsx_requested=True,
            openmsx_passed=True,
        )
        build_summary_path = ok_dir / "msx2_build_summary.json"
        if not build_summary_path.exists():
            raise AssertionError("msx2_build_summary.json was not written")
        build_summary = json.loads(build_summary_path.read_text(encoding="utf-8"))
        if build_summary.get("scope") != "msx2_screen4_megarom_build_summary":
            raise AssertionError(f"Unexpected build summary scope: {build_summary.get('scope')!r}")
        if build_summary.get("preflightArtifactChecks") != artifact_checks:
            raise AssertionError("Build summary did not preserve preflight artifact checks")
        if build_summary.get("preflightOutputArtifactChecks") != preflight_summary.get("outputArtifactChecks"):
            raise AssertionError("Build summary did not preserve preflight output artifact checks")
        build_gate_by_id = {
            item.get("id"): item
            for item in build_summary.get("pipelineGates", [])
            if isinstance(item, dict)
        }
        if build_gate_by_id.get("glass_compile", {}).get("status") != "passed":
            raise AssertionError(f"Build summary did not mark Glass as passed: {build_summary.get('pipelineGates')!r}")
        if build_gate_by_id.get("artifact_validation_against_symbols", {}).get("status") != "passed":
            raise AssertionError(f"Build summary did not mark symbol validation as passed: {build_summary.get('pipelineGates')!r}")
        if build_gate_by_id.get("post_compilation_optimization", {}).get("status") != "check_only_passed":
            raise AssertionError(f"Build summary did not mark Post-ASM check-only status: {build_summary.get('pipelineGates')!r}")
        if build_gate_by_id.get("openmsx_smoke", {}).get("status") != "passed":
            raise AssertionError(f"Build summary did not mark OpenMSX as passed: {build_summary.get('pipelineGates')!r}")
        validation = build_summary.get("validation") or {}
        if validation.get("postAsm") != "check_only_passed" or validation.get("openmsx") != "passed":
            raise AssertionError(f"Build summary validation statuses are wrong: {validation!r}")
        ide_budget_feedback_summary = build_summary.get("ideBudgetFeedback")
        if not isinstance(ide_budget_feedback_summary, dict):
            raise AssertionError(f"Build summary did not include IDE budget feedback summary: {build_summary!r}")
        if ide_budget_feedback_summary.get("status") != "ok":
            raise AssertionError(f"Build summary IDE feedback status is invalid: {ide_budget_feedback_summary!r}")
        if not str(ide_budget_feedback_summary.get("checksum") or "").startswith("fnv1a32:"):
            raise AssertionError(f"Build summary IDE feedback checksum is invalid: {ide_budget_feedback_summary!r}")
        if ide_budget_feedback_summary.get("bytes") != ide_output_check.get("bytes"):
            raise AssertionError(f"Build summary IDE feedback byte count drifted: {ide_budget_feedback_summary!r}")
        if ide_budget_feedback_summary.get("checksum") != ide_output_check.get("checksum"):
            raise AssertionError(f"Build summary IDE feedback checksum drifted: {ide_budget_feedback_summary!r}")
        post_asm_reports = build_summary.get("postAsmReports")
        if not isinstance(post_asm_reports, list) or len(post_asm_reports) != 1:
            raise AssertionError(f"Build summary did not include Post-ASM report summaries: {post_asm_reports!r}")
        post_asm_report = post_asm_reports[0]
        if (
            post_asm_report.get("findings") != 1
            or post_asm_report.get("appliedPatches") != 1
            or post_asm_report.get("deadCandidateSourceBytes") != 384
            or post_asm_report.get("removedSourceBytes") != 128
        ):
            raise AssertionError(f"Build summary Post-ASM report summary is invalid: {post_asm_report!r}")
        post_asm_attempts = build_summary.get("postAsmAttempts")
        if not isinstance(post_asm_attempts, list) or len(post_asm_attempts) != 1:
            raise AssertionError(f"Build summary did not include Post-ASM attempt summaries: {post_asm_attempts!r}")
        post_asm_attempt = post_asm_attempts[0]
        if (
            post_asm_attempt.get("status") != "check_only_passed"
            or post_asm_attempt.get("appliedPatches") != 1
            or post_asm_attempt.get("removedSourceBytes") != 128
            or "unit" not in (post_asm_attempt.get("ruleClasses") or [])
        ):
            raise AssertionError(f"Build summary Post-ASM attempt summary is invalid: {post_asm_attempt!r}")
        for summary_key in ("rom", "asm", "sym"):
            checksum = ((build_summary.get(summary_key) or {}).get("checksum"))
            if not str(checksum or "").startswith("fnv1a32:"):
                raise AssertionError(f"Build summary {summary_key} checksum is invalid: {build_summary.get(summary_key)!r}")
        optimized_report_path = ok_dir / "test.optimized.post-asm-report.json"
        optimized_report_path.write_text(
            json.dumps({
                "input": str(ok_dir / "test.optimized.asm"),
                "metrics": {
                    "block_inventory": {
                        "dead_block_candidates": 1,
                        "dead_candidate_lines": 6,
                        "dead_candidate_source_bytes": 192,
                    },
                    "optimization_summary": {
                        "passes_run": 1,
                        "removed_lines": 8,
                        "removed_source_bytes": 256,
                    },
                },
                "findings": [{"rule_id": "unit_optimized"}],
                "applied_patches": 2,
            }),
            encoding="utf-8",
        )
        write_msx2_build_summary(
            artifact_dir=ok_dir,
            rom_output=rom_path,
            asm_to_compile=asm_path,
            sym_output=sym_path,
            original_size=8192,
            padded_size=8192,
            validation_kind="unit_test",
            post_asm_requested=True,
            post_asm_check_only=False,
            post_asm_applied=False,
            post_asm_report_paths=[post_asm_report_path, optimized_report_path],
            post_asm_rejected_report_paths=[optimized_report_path],
            post_asm_rejected_reason="synthetic optimized ASM Glass failure",
        )
        fallback_summary = json.loads(build_summary_path.read_text(encoding="utf-8"))
        fallback_gate_by_id = {
            item.get("id"): item
            for item in fallback_summary.get("pipelineGates", [])
            if isinstance(item, dict)
        }
        if fallback_gate_by_id.get("post_compilation_optimization", {}).get("status") != "fallback_to_baseline":
            raise AssertionError(f"Build summary did not mark Post-ASM fallback: {fallback_summary.get('pipelineGates')!r}")
        if (fallback_summary.get("validation") or {}).get("postAsm") != "fallback_to_baseline":
            raise AssertionError(f"Build summary validation did not mark Post-ASM fallback: {fallback_summary.get('validation')!r}")
        rejected_attempts = [
            item for item in fallback_summary.get("postAsmAttempts", [])
            if isinstance(item, dict) and item.get("status") == "rejected_validation_failed"
        ]
        if len(rejected_attempts) != 1 or rejected_attempts[0].get("removedSourceBytes") != 256:
            raise AssertionError(f"Build summary did not preserve rejected Post-ASM attempt: {fallback_summary.get('postAsmAttempts')!r}")

        over_dir = root / "over_generated"
        write_artifacts(over_dir, make_budget(9000, over_budget=True), storage_policy)
        (over_dir / "preflight_summary.json").write_text('{"status":"stale"}\n', encoding="utf-8")
        (over_dir / "msx2_ide_budget_feedback.json").write_text('{"status":"stale"}\n', encoding="utf-8")
        (over_dir / "msx2_build_summary.json").write_text('{"status":"stale"}\n', encoding="utf-8")
        (over_dir / "msx2_preflight_failure.json").write_text('{"status":"stale"}\n', encoding="utf-8")
        expect_failure(over_dir, "failed before Glass")
        if (over_dir / "preflight_summary.json").exists():
            raise AssertionError("Failed preflight left a stale preflight_summary.json behind")
        if (over_dir / "msx2_ide_budget_feedback.json").exists():
            raise AssertionError("Failed preflight left a stale msx2_ide_budget_feedback.json behind")
        if (over_dir / "msx2_build_summary.json").exists():
            raise AssertionError("Failed preflight left a stale msx2_build_summary.json behind")
        over_failure_path = over_dir / "msx2_preflight_failure.json"
        if not over_failure_path.exists():
            raise AssertionError("Failed preflight did not write msx2_preflight_failure.json")
        over_failure = json.loads(over_failure_path.read_text(encoding="utf-8"))
        if over_failure.get("scope") != "msx2_screen4_megarom_preflight_failure":
            raise AssertionError(f"Unexpected failure summary scope: {over_failure!r}")
        if over_failure.get("reason") != "logical_package_over_budget":
            raise AssertionError(f"Unexpected over-budget failure reason: {over_failure!r}")
        over_artifact_checks = over_failure.get("artifactChecks")
        if not isinstance(over_artifact_checks, list) or len(over_artifact_checks) < 5:
            raise AssertionError(f"Failure summary did not include input artifact checks: {over_failure!r}")
        over_artifact_names = {item.get("name") for item in over_artifact_checks if isinstance(item, dict)}
        if not {"project_slice.json", "logical_bank_budget.json", "msx2_world_bank_manifest.json", "ram_budget.json"}.issubset(over_artifact_names):
            raise AssertionError(f"Failure summary artifact checks missed required inputs: {over_failure!r}")
        over_gates = over_failure.get("pipelineGates") or []
        over_bank_gate = next((gate for gate in over_gates if gate.get("id") == "bank_allocation_dry_run"), None)
        over_glass_gate = next((gate for gate in over_gates if gate.get("id") == "glass_compile"), None)
        if over_bank_gate is None or over_bank_gate.get("status") != "failed":
            raise AssertionError(f"Failure summary did not mark bank allocation gate failed: {over_failure!r}")
        if over_glass_gate is None or over_glass_gate.get("status") != "not_run":
            raise AssertionError(f"Failure summary did not mark Glass as not run: {over_failure!r}")
        if not (over_failure.get("rom") or {}).get("overBudgetPackages"):
            raise AssertionError(f"Failure summary did not include overBudgetPackages: {over_failure!r}")
        over_manifest = over_failure.get("worldBankManifest") or {}
        if over_manifest.get("overBudgetBankCount") != 1 or over_manifest.get("estimatedPhysicalBankCount") != 1:
            raise AssertionError(f"Failure summary did not include over-budget world bank manifest data: {over_failure!r}")
        if (over_manifest.get("estimatedPhysicalBanks") or [{}])[0].get("status") != "error":
            raise AssertionError(f"Failure summary did not include failing world bank status: {over_failure!r}")
        if not (over_failure.get("planB") or {}).get("recoveryPlan"):
            raise AssertionError(f"Failure summary did not include recoveryPlan: {over_failure!r}")
        over_candidate_ids = {
            item.get("id")
            for item in (over_failure.get("resolverCandidates") or [])
            if isinstance(item, dict)
        }
        if "enable_zx0_preprocess" not in over_candidate_ids or "split_over_budget_world_packages" not in over_candidate_ids:
            raise AssertionError(f"Over-budget failure did not expose resolver candidates: {over_failure!r}")
        split_candidate = next(
            (
                item for item in (over_failure.get("resolverCandidates") or [])
                if isinstance(item, dict) and item.get("id") == "split_over_budget_world_packages"
            ),
            None,
        )
        if not split_candidate or split_candidate.get("blockedBy") != "chunk-to-label SCREEN 4 physical loader is not implemented yet":
            raise AssertionError(f"Over-budget split candidate did not describe chunk loader blocker: {over_failure!r}")

        warning_dir = root / "warning_generated"
        write_artifacts(warning_dir, make_budget(7600), storage_policy)
        output = StringIO()
        with redirect_stdout(output):
            validate_msx2_screen4_megarom_preflight_budget(warning_dir)
        if "preflight warning" not in output.getvalue():
            raise AssertionError("Expected non-strict preflight to report a warning")
        warning_feedback_path = warning_dir / "msx2_ide_budget_feedback.json"
        if not warning_feedback_path.exists():
            raise AssertionError("Warning preflight did not write msx2_ide_budget_feedback.json")
        warning_feedback = json.loads(warning_feedback_path.read_text(encoding="utf-8"))
        if warning_feedback.get("status") != "warning":
            raise AssertionError(f"Warning preflight did not mark IDE feedback as warning: {warning_feedback!r}")
        if not (warning_feedback.get("warnings") or {}).get("warningPackedBanks"):
            raise AssertionError(f"Warning IDE feedback did not expose warningPackedBanks: {warning_feedback!r}")
        if not any(
            item.get("severity") == "recommended"
            for item in (warning_feedback.get("suggestedFixes") or [])
            if isinstance(item, dict)
        ):
            raise AssertionError(f"Warning IDE feedback did not expose recommended Plan B fixes: {warning_feedback!r}")
        (warning_dir / "msx2_build_summary.json").write_text('{"status":"stale"}\n', encoding="utf-8")
        (warning_dir / "msx2_preflight_failure.json").write_text('{"status":"stale"}\n', encoding="utf-8")
        expect_failure(warning_dir, "strict warning gate rejected", strict_warnings=True)
        if (warning_dir / "preflight_summary.json").exists():
            raise AssertionError("Strict warning preflight left a stale preflight_summary.json behind")
        if (warning_dir / "msx2_ide_budget_feedback.json").exists():
            raise AssertionError("Strict warning preflight left a stale msx2_ide_budget_feedback.json behind")
        if (warning_dir / "msx2_build_summary.json").exists():
            raise AssertionError("Strict warning preflight left a stale msx2_build_summary.json behind")
        warning_failure_path = warning_dir / "msx2_preflight_failure.json"
        if not warning_failure_path.exists():
            raise AssertionError("Strict warning preflight did not write msx2_preflight_failure.json")
        warning_failure = json.loads(warning_failure_path.read_text(encoding="utf-8"))
        if warning_failure.get("reason") != "strict_warning_gate_rejected":
            raise AssertionError(f"Unexpected strict warning failure reason: {warning_failure!r}")
        warning_manifest = warning_failure.get("worldBankManifest") or {}
        if warning_manifest.get("warningBankCount") != 1 or warning_manifest.get("overBudgetBankCount") != 0:
            raise AssertionError(f"Strict warning failure did not expose world bank warning counts: {warning_failure!r}")
        warning_gates = warning_failure.get("pipelineGates") or []
        warning_recovery_gate = next((gate for gate in warning_gates if gate.get("id") == "overflow_recovery_plan"), None)
        if warning_recovery_gate is None or warning_recovery_gate.get("status") != "failed":
            raise AssertionError(f"Strict warning failure did not mark recovery gate failed: {warning_failure!r}")
        if not (warning_failure.get("details") or {}).get("warningBanks"):
            raise AssertionError(f"Strict warning failure did not expose warningBanks: {warning_failure!r}")
        warning_candidate_ids = {
            item.get("id")
            for item in (warning_failure.get("resolverCandidates") or [])
            if isinstance(item, dict)
        }
        if "relax_strict_warning_gate" not in warning_candidate_ids:
            raise AssertionError(f"Strict warning failure did not expose resolver candidate: {warning_failure!r}")

        auto_warning_dir = root / "auto_warning_generated"
        write_artifacts(auto_warning_dir, make_budget(7600), storage_policy)
        auto_warning_asm = root / "auto_warning.asm"
        auto_warning_asm.write_text("; synthetic asm\n", encoding="utf-8")
        resolved_dir, resolved_asm = validate_msx2_preflight_with_safe_resolution(
            artifact_dir=auto_warning_dir,
            asm_output=auto_warning_asm,
            project_root=root,
            strict_warnings=True,
            auto_resolve=True,
            skip_zx0_preprocess=False,
            max_attempts=1,
        )
        if resolved_dir != auto_warning_dir or resolved_asm != auto_warning_asm:
            raise AssertionError("Strict warning auto-resolve should keep the same artifact dir and ASM path")
        resolution_path = auto_warning_dir / "msx2_budget_resolution.json"
        if not resolution_path.exists():
            raise AssertionError("Strict warning auto-resolve did not write msx2_budget_resolution.json")
        resolution = json.loads(resolution_path.read_text(encoding="utf-8"))
        if resolution.get("scope") != "msx2_screen4_budget_resolution" or resolution.get("status") != "resolved":
            raise AssertionError(f"Unexpected strict warning resolution summary: {resolution!r}")
        if not any(item.get("action") == "relax_strict_warning_gate" for item in resolution.get("attempts", []) if isinstance(item, dict)):
            raise AssertionError(f"Strict warning resolution did not record relaxed gate attempt: {resolution!r}")
        initial_resolution_attempt = next((item for item in resolution.get("attempts", []) if isinstance(item, dict) and item.get("attempt") == 0), None)
        initial_failure = initial_resolution_attempt.get("failure") if isinstance(initial_resolution_attempt, dict) else None
        if not isinstance(initial_failure, dict) or initial_failure.get("failedGateId") != "overflow_recovery_plan":
            raise AssertionError(f"Strict warning resolution did not preserve failed gate summary: {resolution!r}")
        if "msx2_world_bank_manifest.json" not in (initial_failure.get("artifactCheckNames") or []):
            raise AssertionError(f"Strict warning resolution did not preserve artifact check names: {resolution!r}")
        if (initial_failure.get("worldBankManifest") or {}).get("warningBankCount") != 1:
            raise AssertionError(f"Strict warning resolution did not preserve world bank warning summary: {resolution!r}")
        if "relax_strict_warning_gate" not in (initial_failure.get("eligibleResolverCandidateIds") or []):
            raise AssertionError(f"Strict warning resolution did not preserve eligible resolver candidates: {resolution!r}")
        relaxed_attempt = next((item for item in resolution.get("attempts", []) if isinstance(item, dict) and item.get("action") == "relax_strict_warning_gate"), None)
        if not relaxed_attempt or relaxed_attempt.get("candidateId") != "relax_strict_warning_gate":
            raise AssertionError(f"Strict warning resolution did not tag the selected candidate: {resolution!r}")

        multi_bank_dir = root / "multi_bank_loader_generated"
        multi_storage_policy = [
            {
                "type": "msx2screen",
                "id": "test_room_a",
                "name": "Test Room A",
                "rawBytes": 5000,
                "storedBytesEstimate": 5000,
                "accessPattern": "mixed_load_to_vram_and_runtime_read",
                "mutable": False,
                "decision": "MIXED_ROM_RAW_TO_VRAM_AND_ROM_RAW",
            },
            {
                "type": "msx2screen",
                "id": "test_room_b",
                "name": "Test Room B",
                "rawBytes": 5000,
                "storedBytesEstimate": 5000,
                "accessPattern": "mixed_load_to_vram_and_runtime_read",
                "mutable": False,
                "decision": "MIXED_ROM_RAW_TO_VRAM_AND_ROM_RAW",
            },
        ]
        multi_budget = make_budget(5000)
        multi_packages = [
            {
                "id": "msx2screen.test_room_a",
                "type": "msx2screen",
                "sourceId": "test_room_a",
                "recommendedBankClass": "world.screen",
                "usedBytes": 5000,
                "freeBytesIfAlone": 3192,
                "warning": False,
                "overBudgetBytes": 0,
                "canSplit": True,
            },
            {
                "id": "msx2screen.test_room_b",
                "type": "msx2screen",
                "sourceId": "test_room_b",
                "recommendedBankClass": "world.screen",
                "usedBytes": 5000,
                "freeBytesIfAlone": 3192,
                "warning": False,
                "overBudgetBytes": 0,
                "canSplit": True,
            },
        ]
        multi_budget.update({
            "totalPayloadBytes": 10000,
            "estimatedMinimumBanks": 2,
            "estimatedPackedBankCount": 2,
            "estimatedPackedBanks": [
                {
                    "bankIndex": 0,
                    "bankSizeBytes": 8192,
                    "warningThresholdBytes": 7372,
                    "usedBytes": 5000,
                    "freeBytes": 3192,
                    "usedPercent": 61.04,
                    "warning": False,
                    "overBudgetBytes": 0,
                    "status": "ok",
                    "packages": [{"id": "msx2screen.test_room_a", "usedBytes": 5000, "recommendedBankClass": "world.screen"}],
                },
                {
                    "bankIndex": 1,
                    "bankSizeBytes": 8192,
                    "warningThresholdBytes": 7372,
                    "usedBytes": 5000,
                    "freeBytes": 3192,
                    "usedPercent": 61.04,
                    "warning": False,
                    "overBudgetBytes": 0,
                    "status": "ok",
                    "packages": [{"id": "msx2screen.test_room_b", "usedBytes": 5000, "recommendedBankClass": "world.screen"}],
                },
            ],
            "overBudgetPackages": [],
            "warningPackages": [],
            "warningPackedBanks": [],
            "bankClassSummary": [{
                "id": "world.screen",
                "packageCount": 2,
                "usedBytes": 10000,
                "estimatedMinimumBanks": 2,
                "warningPackageCount": 0,
                "overBudgetPackageCount": 0,
                "largestPackage": {"id": "msx2screen.test_room_a", "usedBytes": 5000},
            }],
            "recoveryRecommendations": [{
                "severity": "info",
                "target": "loader",
                "reason": "Multiple estimated data banks require a multi-bank loader.",
                "action": "Emit per-chunk SCREEN 4 data bank switching before Glass.",
            }],
            "packages": multi_packages,
        })
        write_artifacts(multi_bank_dir, multi_budget, multi_storage_policy)
        validate_msx2_screen4_megarom_preflight_budget(multi_bank_dir)
        if (multi_bank_dir / "msx2_preflight_failure.json").exists():
            raise AssertionError("Supported multi-screen data-bank plan should not leave a failure summary")
        multi_summary = json.loads((multi_bank_dir / "preflight_summary.json").read_text(encoding="utf-8"))
        if multi_summary.get("rom", {}).get("estimatedPackedBankCount") != 2:
            raise AssertionError(f"Multi-bank preflight summary lost bank count: {multi_summary!r}")

        chunked_multi_dir = root / "multi_bank_chunked_generated"
        chunked_budget = json.loads(json.dumps(multi_budget))
        chunked_budget["splitPackages"] = [{
            "id": "msx2screen.test_room_a#chunk00",
            "splitFrom": "msx2screen.test_room_a",
            "splitIndex": 0,
            "splitCount": 2,
            "splitStrategy": "auto_world_package_chunk",
        }]
        missing_manifest_dir = root / "multi_bank_chunked_missing_manifest"
        missing_manifest_budget = copy.deepcopy(chunked_budget)
        missing_manifest_budget["splitChunkManifest"] = []
        write_artifacts(missing_manifest_dir, missing_manifest_budget, multi_storage_policy)
        missing_manifest_budget["splitChunkManifest"] = []
        missing_project_slice = json.loads((missing_manifest_dir / "project_slice.json").read_text(encoding="utf-8"))
        rewrite_budget_artifacts(missing_manifest_dir, missing_project_slice, missing_manifest_budget)
        expect_failure(missing_manifest_dir, "splitPackages must include one splitChunkManifest entry per chunk")

        mismatched_manifest_dir = root / "multi_bank_chunked_mismatched_manifest"
        mismatched_manifest_budget = copy.deepcopy(chunked_budget)
        ensure_split_chunk_manifest(mismatched_manifest_budget)
        mismatched_manifest_budget["splitChunkManifest"][0]["chunkId"] = "msx2screen.other_room#chunk00"
        write_artifacts(mismatched_manifest_dir, mismatched_manifest_budget, multi_storage_policy)
        mismatched_project_slice = json.loads((mismatched_manifest_dir / "project_slice.json").read_text(encoding="utf-8"))
        rewrite_budget_artifacts(mismatched_manifest_dir, mismatched_project_slice, mismatched_manifest_budget)
        expect_failure(mismatched_manifest_dir, "splitChunkManifest does not match splitPackages")

        missing_payload_dir = root / "multi_bank_chunked_missing_payload_labels"
        missing_payload_budget = copy.deepcopy(chunked_budget)
        ensure_split_chunk_manifest(missing_payload_budget)
        missing_payload_budget["splitChunkManifest"][0].pop("payloadLabels", None)
        write_artifacts(missing_payload_dir, missing_payload_budget, multi_storage_policy)
        missing_payload_project_slice = json.loads((missing_payload_dir / "project_slice.json").read_text(encoding="utf-8"))
        rewrite_budget_artifacts(missing_payload_dir, missing_payload_project_slice, missing_payload_budget)
        expect_failure(missing_payload_dir, "splitChunkManifest entry is missing payloadLabels")

        bad_payload_count_dir = root / "multi_bank_chunked_bad_payload_label_count"
        bad_payload_count_budget = copy.deepcopy(chunked_budget)
        ensure_split_chunk_manifest(bad_payload_count_budget)
        bad_payload_count_budget["splitChunkManifest"][0]["payloadLabelCount"] = 99
        write_artifacts(bad_payload_count_dir, bad_payload_count_budget, multi_storage_policy)
        bad_payload_count_project_slice = json.loads((bad_payload_count_dir / "project_slice.json").read_text(encoding="utf-8"))
        rewrite_budget_artifacts(bad_payload_count_dir, bad_payload_count_project_slice, bad_payload_count_budget)
        expect_failure(bad_payload_count_dir, "payloadLabelCount does not match payloadLabels")

        oversized_payload_dir = root / "multi_bank_chunked_oversized_payload_bytes"
        oversized_payload_budget = copy.deepcopy(chunked_budget)
        ensure_split_chunk_manifest(oversized_payload_budget)
        oversized_payload_budget["splitChunkManifest"][0]["payloadBytes"] = 9000
        write_artifacts(oversized_payload_dir, oversized_payload_budget, multi_storage_policy)
        oversized_payload_project_slice = json.loads((oversized_payload_dir / "project_slice.json").read_text(encoding="utf-8"))
        rewrite_budget_artifacts(oversized_payload_dir, oversized_payload_project_slice, oversized_payload_budget)
        expect_failure(oversized_payload_dir, "payloadBytes exceeds one 8KB bank")

        missing_loader_coverage_dir = root / "multi_bank_chunked_missing_loader_coverage"
        missing_loader_coverage_budget = copy.deepcopy(chunked_budget)
        ensure_split_chunk_manifest(missing_loader_coverage_budget)
        missing_loader_coverage_budget["splitChunkManifest"][0].pop("loaderCoverageStatus", None)
        write_artifacts(missing_loader_coverage_dir, missing_loader_coverage_budget, multi_storage_policy)
        missing_loader_coverage_project_slice = json.loads((missing_loader_coverage_dir / "project_slice.json").read_text(encoding="utf-8"))
        rewrite_budget_artifacts(missing_loader_coverage_dir, missing_loader_coverage_project_slice, missing_loader_coverage_budget)
        expect_failure(missing_loader_coverage_dir, "splitChunkManifest entry is missing loaderCoverageStatus")

        incomplete_loader_coverage_dir = root / "multi_bank_chunked_incomplete_loader_coverage"
        incomplete_loader_coverage_budget = copy.deepcopy(chunked_budget)
        ensure_split_chunk_manifest(incomplete_loader_coverage_budget)
        incomplete_loader_coverage_budget["splitChunkManifest"][0]["loaderCoverageStatus"] = "partial"
        incomplete_loader_coverage_budget["splitChunkManifest"][0]["loaderUncoveredPayloadLabels"] = ["TEST_UNKNOWN_PAYLOAD"]
        write_artifacts(incomplete_loader_coverage_dir, incomplete_loader_coverage_budget, multi_storage_policy)
        incomplete_loader_coverage_project_slice = json.loads((incomplete_loader_coverage_dir / "project_slice.json").read_text(encoding="utf-8"))
        rewrite_budget_artifacts(incomplete_loader_coverage_dir, incomplete_loader_coverage_project_slice, incomplete_loader_coverage_budget)
        expect_failure(incomplete_loader_coverage_dir, "loader coverage is incomplete")

        write_artifacts(chunked_multi_dir, chunked_budget, multi_storage_policy)
        expect_failure(chunked_multi_dir, "cannot safely map that bank plan")
        chunked_failure = json.loads((chunked_multi_dir / "msx2_preflight_failure.json").read_text(encoding="utf-8"))
        chunked_candidate_ids = {
            item.get("id")
            for item in (chunked_failure.get("resolverCandidates") or [])
            if isinstance(item, dict)
        }
        if chunked_failure.get("reason") != "loader_multi_bank_data_window_not_implemented" or "emit_multi_bank_world_data_loader" not in chunked_candidate_ids:
            raise AssertionError(f"Chunked multi-bank loader failure did not expose loader resolver candidate: {chunked_failure!r}")
        chunked_loader_candidate = next(
            (
                item for item in (chunked_failure.get("resolverCandidates") or [])
                if isinstance(item, dict) and item.get("id") == "emit_multi_bank_world_data_loader"
            ),
            None,
        )
        if not chunked_loader_candidate or chunked_loader_candidate.get("blockedBy") != "chunk-to-label SCREEN 4 physical loader is not implemented yet":
            raise AssertionError(f"Chunked loader failure did not explain physical chunk blocker: {chunked_failure!r}")
        candidate_chunk_labels = chunked_loader_candidate.get("chunkLabels") or []
        if (
            len(candidate_chunk_labels) != 1
            or not candidate_chunk_labels[0].get("dataLabel")
            or not candidate_chunk_labels[0].get("loaderSymbol")
            or not candidate_chunk_labels[0].get("payloadLabels")
            or candidate_chunk_labels[0].get("payloadBytes") != 4864
            or candidate_chunk_labels[0].get("payloadLabelCount") != 3
            or candidate_chunk_labels[0].get("loaderCoverageStatus") != "covered"
        ):
            raise AssertionError(f"Chunked loader failure did not expose resolver chunk labels: {chunked_failure!r}")
        chunked_plan = chunked_failure.get("automaticResolutionPlan") or {}
        if not (chunked_plan.get("blockedReasons") or [{}])[0].get("missingPart"):
            raise AssertionError(f"Chunked loader failure did not preserve blocked resolver detail in automatic plan: {chunked_failure!r}")
        if "loader coverage" not in str((chunked_plan.get("blockedReasons") or [{}])[0].get("missingPart") or ""):
            raise AssertionError(f"Chunked loader failure did not explain the remaining loader-work blocker: {chunked_failure!r}")
        chunk_manifest = ((chunked_failure.get("details") or {}).get("screen4DataBankPlan") or {}).get("splitChunkManifest") or []
        if (
            len(chunk_manifest) != 1
            or not chunk_manifest[0].get("dataLabel")
            or not chunk_manifest[0].get("dataBankSymbol")
            or chunk_manifest[0].get("windowAddress") != "#8000"
        ):
            raise AssertionError(f"Chunked loader failure did not preserve loader-addressable chunk manifest: {chunked_failure!r}")
        try:
            validate_msx2_preflight_with_safe_resolution(
                chunked_multi_dir,
                auto_warning_asm,
                root,
                strict_warnings=True,
                auto_resolve=True,
                skip_zx0_preprocess=False,
                max_attempts=1,
            )
            raise AssertionError("Chunked loader auto-resolve should remain blocked until chunk-to-label loading exists")
        except RuntimeError:
            pass
        chunked_resolution = json.loads((chunked_multi_dir / "msx2_budget_resolution.json").read_text(encoding="utf-8"))
        blocked_attempt = next(
            (
                item for item in (chunked_resolution.get("attempts") or [])
                if isinstance(item, dict) and item.get("candidateId") == "emit_multi_bank_world_data_loader"
            ),
            None,
        )
        if not blocked_attempt or blocked_attempt.get("status") != "blocked" or not blocked_attempt.get("missingPart"):
            raise AssertionError(f"Chunked auto-resolve did not record blocked loader attempt: {chunked_resolution!r}")
        if (
            blocked_attempt.get("splitChunkCount") != 1
            or not (blocked_attempt.get("chunkLabels") or [{}])[0].get("payloadLabels")
        ):
            raise AssertionError(f"Chunked auto-resolve did not preserve chunk labels for the future regenerator: {chunked_resolution!r}")
        initial_attempt = next(
            (
                item for item in (chunked_resolution.get("attempts") or [])
                if isinstance(item, dict) and item.get("action") == "initial_preflight"
            ),
            None,
        )
        blocked_chunk_context = (((initial_attempt or {}).get("failure") or {}).get("blockedChunkLabelCandidates") or [])
        if not blocked_chunk_context or not blocked_chunk_context[0].get("chunkLabels"):
            raise AssertionError(f"Initial preflight summary did not preserve chunk label context: {chunked_resolution!r}")
        auto_rom_path = auto_warning_dir / "auto_warning.rom"
        auto_sym_path = auto_warning_dir / "auto_warning.sym"
        auto_rom_path.write_bytes(b"CD" + bytes([0xFF]) * 8190)
        auto_sym_path.write_text("START: 4000\n", encoding="utf-8")
        write_msx2_build_summary(
            artifact_dir=auto_warning_dir,
            rom_output=auto_rom_path,
            asm_to_compile=auto_warning_asm,
            sym_output=auto_sym_path,
            original_size=8192,
            padded_size=8192,
            validation_kind="unit_test_auto_resolved",
        )
        auto_build_summary_path = auto_warning_dir / "msx2_build_summary.json"
        auto_build_summary = json.loads(auto_build_summary_path.read_text(encoding="utf-8"))
        budget_resolution = auto_build_summary.get("budgetResolution")
        if not isinstance(budget_resolution, dict):
            raise AssertionError(f"Build summary did not include budget resolution summary: {auto_build_summary!r}")
        if budget_resolution.get("status") != "resolved" or budget_resolution.get("finalAction") != "relax_strict_warning_gate":
            raise AssertionError(f"Build summary budget resolution is invalid: {budget_resolution!r}")
        if budget_resolution.get("attempts") != len(resolution.get("attempts") or []):
            raise AssertionError(f"Build summary budget resolution attempt count drifted: {budget_resolution!r}")
        if not str(budget_resolution.get("checksum") or "").startswith("fnv1a32:"):
            raise AssertionError(f"Build summary budget resolution checksum is invalid: {budget_resolution!r}")

        ram_over_dir = root / "ram_over_generated"
        write_artifacts(ram_over_dir, make_budget(4096), storage_policy, make_ram_budget(status="error", free_bytes=-1))
        expect_failure(ram_over_dir, "runtime RAM exceeds limit")
        ram_failure_path = ram_over_dir / "msx2_preflight_failure.json"
        if not ram_failure_path.exists():
            raise AssertionError("RAM budget failure did not write msx2_preflight_failure.json")
        ram_failure = json.loads(ram_failure_path.read_text(encoding="utf-8"))
        ram_candidate_ids = {
            item.get("id")
            for item in (ram_failure.get("resolverCandidates") or [])
            if isinstance(item, dict)
        }
        if ram_failure.get("reason") != "ram_budget_failed" or "reduce_runtime_ram" not in ram_candidate_ids:
            raise AssertionError(f"RAM budget failure did not expose RAM resolver candidate: {ram_failure!r}")

        ram_sections_dir = root / "ram_sections_generated"
        ram_without_sections = make_ram_budget()
        ram_without_sections["sections"] = []
        write_artifacts(ram_sections_dir, make_budget(4096), storage_policy, ram_without_sections)
        expect_failure(ram_sections_dir, "ramBudget has no runtime sections")

        bad_cache_bytes_dir = root / "bad_cache_bytes_generated"
        ram_bad_cache_bytes = make_ram_budget()
        for section in ram_bad_cache_bytes["sections"]:
            if section.get("id") == "runtime.behavior_current_cache":
                section["bytes"] = 224
                section["end"] = "#C460"
        write_artifacts(bad_cache_bytes_dir, make_budget(4096), storage_policy, ram_bad_cache_bytes)
        expect_failure(
            bad_cache_bytes_dir,
            "runtime.behavior_current_cache must reserve exactly one current 16x12 screen layer",
        )

        bad_runtime_storage_dir = root / "bad_runtime_storage_policy_generated"
        bad_runtime_policy = json.loads(json.dumps(storage_policy))
        ensure_screen_storage_parts(bad_runtime_policy)
        bad_runtime_policy[0]["parts"][-1]["placement"] = "ram"
        bad_runtime_policy[0]["parts"][-1]["runtimePlacement"] = "persistent_ram"
        write_artifacts(bad_runtime_storage_dir, make_budget(4096), bad_runtime_policy)
        expect_failure(bad_runtime_storage_dir, "SCREEN 4 runtime layers must remain raw in world data banks")

        mismatch_dir = root / "mismatch_generated"
        write_artifacts(mismatch_dir, make_budget(4096), storage_policy)
        (mismatch_dir / "asset_storage_policy.json").write_text("[]\n", encoding="utf-8")
        expect_failure(mismatch_dir, "asset_storage_policy.json differs")

        ram_mismatch_dir = root / "ram_mismatch_generated"
        write_artifacts(ram_mismatch_dir, make_budget(4096), storage_policy)
        (ram_mismatch_dir / "ram_budget.json").write_text("{}\n", encoding="utf-8")
        expect_failure(ram_mismatch_dir, "ram_budget.json differs")

        empty_budget_dir = root / "empty_budget_generated"
        write_artifacts(empty_budget_dir, make_budget(4096), storage_policy)
        (empty_budget_dir / "logical_bank_budget.json").write_text("", encoding="utf-8")
        expect_failure(empty_budget_dir, "logical_bank_budget.json is empty")

        corrupt_budget_dir = root / "corrupt_budget_generated"
        write_artifacts(corrupt_budget_dir, make_budget(4096), storage_policy)
        (corrupt_budget_dir / "logical_bank_budget.json").write_text("{not json}\n", encoding="utf-8")
        expect_failure(corrupt_budget_dir, "logical_bank_budget.json is not valid JSON")

        class_mismatch_dir = root / "class_mismatch_generated"
        bad_class_budget = make_budget(4096)
        bad_class_budget["bankClassSummary"][0]["usedBytes"] = 2048
        write_artifacts(class_mismatch_dir, bad_class_budget, storage_policy)
        expect_failure(class_mismatch_dir, "bankClassSummary total")

        recovery_plan_mismatch_dir = root / "recovery_plan_mismatch_generated"
        bad_recovery_budget = make_budget(4096)
        bad_recovery_budget["recoveryPlan"][0]["id"] = "wrong_step"
        write_artifacts(recovery_plan_mismatch_dir, bad_recovery_budget, storage_policy)
        expect_failure(recovery_plan_mismatch_dir, "recoveryPlan order")

        world_mismatch_dir = root / "world_mismatch_generated"
        bad_world_summary = [{
            "worldId": "world_test",
            "assetCount": 1,
            "screenCount": 1,
            "estimatedBytes": 2048,
            "estimated8kBanks": 1,
            "bankClassBytes": [{"id": "world.screen", "usedBytes": 2048}],
        }]
        write_artifacts(world_mismatch_dir, make_budget(4096), storage_policy, world_package_summary=bad_world_summary)
        expect_failure(world_mismatch_dir, "worldPackageSummary estimatedBytes")

        overflow_asm = root / "resident_overflow.asm"
        overflow_asm.write_text(
            "\n".join([
                "    org #4000",
                "init_big_runtime:",
                "    db " + ",".join(["#00"] * 96),
                "SCREEN_TEST_COLLISION:",
                "    ds 224, #00",
                "SCREEN_TEST_BEHAVIOR:",
                "    db " + ",".join(["#01"] * 64),
                "; MSX2 SCREEN 4 cold data bank.",
                "    ds #C000 - $, #FF",
            ]) + "\n",
            encoding="utf-8",
        )
        diagnostic = describe_glass_compile_failure("", "Negative initial size: -213", overflow_asm)
        if not diagnostic or "MSX2 MegaROM resident bank overflow" not in diagnostic or "#C000 padding" not in diagnostic:
            raise AssertionError(f"Unexpected Glass resident overflow diagnostic: {diagnostic}")
        generic_diagnostic = describe_glass_compile_failure("", "Negative initial size: -12", root / "missing.asm")
        if not generic_diagnostic or "MegaROM bank padding overflow" not in generic_diagnostic:
            raise AssertionError(f"Unexpected generic Glass overflow diagnostic: {generic_diagnostic}")
        compile_failure_dir = root / "compile_failure_generated"
        write_artifacts(compile_failure_dir, make_budget(4096), storage_policy)
        validate_msx2_screen4_megarom_preflight_budget(compile_failure_dir)
        compile_failure_path = write_msx2_compile_failure_summary(
            compile_failure_dir,
            overflow_asm,
            root / "failed.rom",
            root / "failed.sym",
            diagnostic,
        )
        if compile_failure_path is None or not compile_failure_path.exists():
            raise AssertionError("Expected msx2_compile_failure.json to be written")
        compile_failure = json.loads(compile_failure_path.read_text(encoding="utf-8"))
        if compile_failure.get("scope") != "msx2_screen4_megarom_compile_failure":
            raise AssertionError(f"Unexpected compile failure scope: {compile_failure}")
        glass_gate = next((gate for gate in compile_failure.get("pipelineGates", []) if gate.get("id") == "glass_compile"), None)
        if not glass_gate or glass_gate.get("status") != "failed":
            raise AssertionError(f"Compile failure did not mark glass_compile failed: {compile_failure}")
        if "Move cold read-only tables" not in (compile_failure.get("planB") or {}).get("primary", ""):
            raise AssertionError(f"Compile failure did not include Plan B guidance: {compile_failure}")
        if not (compile_failure.get("planB") or {}).get("largestContributors"):
            raise AssertionError(f"Compile failure did not summarize largest resident contributors in Plan B: {compile_failure}")
        resident_bank_analysis = compile_failure.get("residentBankAnalysis") or {}
        contributor_labels = [
            item.get("label")
            for item in resident_bank_analysis.get("topContributors") or []
            if isinstance(item, dict)
        ]
        if resident_bank_analysis.get("scope") != "msx2_screen4_resident_label_spans" or "SCREEN_TEST_COLLISION" not in contributor_labels:
            raise AssertionError(f"Compile failure did not expose resident contributors: {compile_failure}")
        regeneration_readiness = compile_failure.get("residentRegenerationReadiness") or {}
        if regeneration_readiness.get("status") != "generator_rule_available":
            raise AssertionError(f"Compile failure did not classify resident layer regeneration readiness: {compile_failure}")
        if not regeneration_readiness.get("topTargets") or regeneration_readiness.get("candidateId") != "move_cold_readonly_data_to_world_bank":
            raise AssertionError(f"Compile failure did not expose movable cold-data targets: {compile_failure}")
        collision_entry = next((item for item in resident_bank_analysis.get("topContributors") or [] if item.get("label") == "SCREEN_TEST_COLLISION"), None)
        if not collision_entry or int(collision_entry.get("startLine") or 0) <= 0 or int(collision_entry.get("endLine") or 0) < int(collision_entry.get("startLine") or 0):
            raise AssertionError(f"Compile failure resident contributor did not include valid line span: {compile_failure}")
        compile_candidate_ids = {
            item.get("id")
            for item in (compile_failure.get("resolverCandidates") or [])
            if isinstance(item, dict)
        }
        if "run_post_asm_dead_block_optimizer" not in compile_candidate_ids:
            raise AssertionError(f"Compile failure did not expose automatic post-ASM resolver candidate: {compile_failure}")
        if "move_cold_readonly_data_to_world_bank" not in compile_candidate_ids:
            raise AssertionError(f"Compile failure did not expose resident overflow resolver candidate: {compile_failure}")
        cold_data_candidate = next(
            (
                item for item in (compile_failure.get("resolverCandidates") or [])
                if isinstance(item, dict) and item.get("id") == "move_cold_readonly_data_to_world_bank"
            ),
            None,
        )
        if not cold_data_candidate or cold_data_candidate.get("eligible") is not True or cold_data_candidate.get("readinessStatus") != "generator_rule_available":
            raise AssertionError(f"Compile failure did not mark resident cold-data regeneration as actionable: {compile_failure}")
        if cold_data_candidate.get("nextAutomaticAction") != "regenerate_from_project_json_with_current_screen4_runtime_layer_policy":
            raise AssertionError(f"Compile failure did not expose the next automatic resident action: {compile_failure}")
        automatic_plan = compile_failure.get("automaticResolutionPlan") or {}
        if automatic_plan.get("status") != "ready" or automatic_plan.get("nextCandidateId") != "move_cold_readonly_data_to_world_bank":
            raise AssertionError(f"Compile failure did not expose an automatic resolution plan: {compile_failure}")
        if "run_post_asm_dead_block_optimizer" not in (automatic_plan.get("eligibleCandidateIds") or []):
            raise AssertionError(f"Compile failure automatic plan lost Post-ASM fallback candidate: {compile_failure}")
        compile_failure_with_attempts_path = write_msx2_compile_failure_summary(
            compile_failure_dir,
            overflow_asm,
            root / "failed.rom",
            root / "failed.sym",
            diagnostic,
            resolver_attempts=[{
                "attempt": 1,
                "action": "run_post_asm_dead_block_optimizer",
                "candidateId": "run_post_asm_dead_block_optimizer",
                "status": "failed",
                "reason": "still over budget",
            }],
        )
        compile_failure_with_attempts = json.loads(compile_failure_with_attempts_path.read_text(encoding="utf-8"))
        attempts = compile_failure_with_attempts.get("resolverAttempts")
        if not isinstance(attempts, list) or attempts[0].get("candidateId") != "run_post_asm_dead_block_optimizer":
            raise AssertionError(f"Compile failure did not preserve resolver attempts: {compile_failure_with_attempts}")

    print("MSX2 MegaROM preflight budget checks passed.")


if __name__ == "__main__":
    main()
