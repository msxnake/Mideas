#!/usr/bin/env python3
"""Build MSX2 vertical shooter 60Hz smoke (2 enemy bullets, tileVertical scroll)."""

from __future__ import annotations

import argparse
import copy
import json
import sys
import tempfile
from pathlib import Path

from build_msx2screen_layers_smoke import (
    repo_root_from_script,
    run_command,
    validate_project_slice_artifact,
)


def parse_args() -> argparse.Namespace:
    root = repo_root_from_script()
    out = root / "test" / "msx2-screen4" / "out"
    parser = argparse.ArgumentParser(
        description="Build vertical MSX2 shooter 60Hz MegaROM smoke (maxEnemyShots=2)"
    )
    parser.add_argument("--project-root", default=str(root), help="Mideas repository root")
    parser.add_argument(
        "--json",
        default=str(root / "json" / "galaxian_msx2_mideas.json"),
        help="Base Galaxian project JSON to patch for vertical shooter contract",
    )
    parser.add_argument(
        "--asm-output",
        default=str(out / "vertical_shooter60hz_msx2_screen4_megarom.asm"),
        help="Output ASM path",
    )
    parser.add_argument(
        "--rom-output",
        default=str(out / "vertical_shooter60hz_msx2_screen4_megarom.rom"),
        help="Output ROM path",
    )
    parser.add_argument(
        "--sym-output",
        default=str(out / "vertical_shooter60hz_msx2_screen4_megarom.sym"),
        help="Output symbols path",
    )
    parser.add_argument("--skip-openmsx", action="store_true", help="Build and static-check only")
    return parser.parse_args()


def patch_vertical_shooter60hz_project(project: dict) -> dict:
    """Derive a vertical shooter 60Hz contract from the Galaxian SCREEN 4 project."""
    patched = copy.deepcopy(project)
    screen_ids = ("screen_galaxian_msx2",)
    player_ids = ("entity_galaxian_player",)
    drop_asset_ids = {
        "screen_galaxian_msx2_phase2",
    }
    patched["assets"] = [
        asset for asset in patched.get("assets", [])
        if asset.get("id") not in drop_asset_ids
    ]

    shooter_runtime = {
        "direction": "vertical",
        "scrollMode": "tileVertical",
        "playerMode": "single",
        "hudMode": "compactTop",
        "budget": {
            "targetHz": 60,
            "maxEnemies": 8,
            "maxPlayerShots": 2,
            "maxEnemyShots": 2,
            "maxPowerups": 0,
            "maxExplosions": 4,
            "maxBossParts": 0,
            "activeIrqProfile": "IRQ_STAGE_SCROLL_EVEN",
        },
    }

    for asset in patched.get("assets", []):
        if asset.get("type") != "msx2screen":
            continue
        screen_id = asset.get("id")
        if screen_id not in screen_ids:
            continue
        data = asset.setdefault("data", {})
        runtime = data.setdefault("runtime", {})
        runtime["screenEngine"] = "shooter"
        runtime["movementMode"] = "shooterVertical"
        runtime["shooter"] = copy.deepcopy(shooter_runtime)

        entities = data.get("layers", {}).get("entities", [])
        for entity in entities:
            if entity.get("id") not in player_ids:
                continue
            components = entity.setdefault("components", {})
            player_control = components.setdefault("msx2_player_control", {})
            player_control["controlMode"] = "shooterVertical"
            player_control["movementMode"] = "shooterVertical"
            movement = components.setdefault("msx2_movement", {})
            movement["mode"] = "shooterVertical"
            params = entity.setdefault("params", {})
            params["controlMode"] = "shooterVertical"
            params["movementMode"] = "shooterVertical"
            params["engine"] = "shooterVertical"

    for asset in patched.get("assets", []):
        if asset.get("type") != "worldmap":
            continue
        data = asset.get("data", {})
        nodes = data.get("nodes", [])
        data["nodes"] = [node for node in nodes if node.get("screenAssetId") not in drop_asset_ids]
        connections = data.get("connections", [])
        kept_node_ids = {node.get("id") for node in data["nodes"]}
        data["connections"] = [
            connection
            for connection in connections
            if connection.get("fromNodeId") in kept_node_ids and connection.get("toNodeId") in kept_node_ids
        ]

    return patched


def validate_asm(path: Path) -> None:
    asm = path.read_text(encoding="utf-8", errors="replace")
    required = [
        "Mideas MSX2 SCREEN 4 tile backend",
        "; ROM Mode: megarom",
        "MSX2_SHOOTER60HZ_TARGET_HZ EQU 60",
        "MSX2_SHOOTER60HZ_MAX_ENEMY_SHOTS EQU 2",
        "MSX2_SHOOTER60HZ_ACTIVE_IRQ_PROFILE EQU 2",
        "IRQ_STAGE_SCROLL_EVEN",
        "init_msx2_shooter_scroll_row:",
        "update_msx2_shooter_scroll_row:",
        "call update_msx2_shooter60hz_frame",
        "update_msx2_shooter60hz_present_frame:",
        "msx2_enemy_bullet_update_slot:",
        "call update_msx2_enemy_bullet",
        "msx2_enemy_bullet_1_active EQU #C040",
        ".enemy_bullet_count_after_slot_0",
        "cp MSX2_SHOOTER60HZ_MAX_ENEMY_SHOTS",
        "call write_hardware_sprite_attrs",
        "update_msx2_shooter_music_tick:",
        "cp 6",
    ]
    forbidden = [
        "update_msx2_galaxian_attack_scheduler",
        "msx2_init_galaxian_attack_runtime",
    ]
    missing = [needle for needle in required if needle not in asm]
    if missing:
        raise RuntimeError(
            "Vertical shooter60Hz ASM is missing expected signals: " + ", ".join(missing)
        )
    present_forbidden = [needle for needle in forbidden if needle in asm]
    if present_forbidden:
        raise RuntimeError(
            "Vertical shooter60Hz ASM still contains horizontal Galaxian paths: "
            + ", ".join(present_forbidden)
        )

    # scroll_row on even frames only (IRQ_STAGE_SCROLL_EVEN)
    frame_dispatch = asm.split("update_msx2_shooter60hz_frame:", 1)
    if len(frame_dispatch) < 2:
        raise RuntimeError("update_msx2_shooter60hz_frame not found")
    pre_frame = frame_dispatch[1].split("update_msx2_shooter60hz_present_frame:", 1)[0]
    if "and 1" not in pre_frame or "update_msx2_shooter_scroll_row" not in pre_frame:
        raise RuntimeError(
            "Vertical shooter pre-frame dispatch must gate scroll_row to even frames"
        )


def validate_rom(path: Path) -> None:
    data = path.read_bytes()
    if len(data) <= 32768 or len(data) % 8192 != 0:
        raise RuntimeError(f"Vertical shooter MegaROM size must be >32KB and 8KB-aligned, got {len(data)}")
    if data[:2] != b"AB":
        raise RuntimeError(f"Vertical shooter MegaROM header must start with AB, got {data[:2]!r}")


def main() -> None:
    args = parse_args()
    project_root = Path(args.project_root).expanduser().resolve()
    base_json = Path(args.json).expanduser().resolve()
    asm_output = Path(args.asm_output).expanduser().resolve()
    rom_output = Path(args.rom_output).expanduser().resolve()
    sym_output = Path(args.sym_output).expanduser().resolve()

    asm_output.parent.mkdir(parents=True, exist_ok=True)

    base_project = json.loads(base_json.read_text(encoding="utf-8"))
    patched_project = patch_vertical_shooter60hz_project(base_project)

    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        suffix=".json",
        delete=False,
        dir=asm_output.parent,
    ) as handle:
        json.dump(patched_project, handle, ensure_ascii=False)
        temp_json = Path(handle.name)

    try:
        run_command(
            [
                sys.executable,
                "scripts/build_mideas_unified_rom.py",
                "--json",
                str(temp_json),
                "--project-root",
                str(project_root),
                "--asm-output",
                str(asm_output),
                "--rom-output",
                str(rom_output),
                "--sym-output",
                str(sym_output),
                "--rom-mode",
                "megarom",
                "--target-format",
                "konami",
                "--skip-zx0-preprocess",
            ],
            cwd=project_root,
            timeout=180,
        )
    finally:
        temp_json.unlink(missing_ok=True)

    validate_asm(asm_output)
    validate_rom(rom_output)
    validate_project_slice_artifact(
        asm_output,
        expect_stage_banner=False,
        require_preflight_summary=True,
    )

    print(f"Vertical MSX2 shooter 60Hz MegaROM smoke passed: {rom_output}")


if __name__ == "__main__":
    main()
