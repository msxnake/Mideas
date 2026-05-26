#!/usr/bin/env python3
"""Build a deterministic MSX2 SCREEN 4 project that requires two cold data banks."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

from build_msx2screen_layers_smoke import (
    repo_root_from_script,
    run_command,
    validate_project_slice_artifact,
)


TARGET_SCREEN_ID = "screen_galaxian_msx2_phase2"


def parse_args() -> argparse.Namespace:
    root = repo_root_from_script()
    out = root / "test" / "msx2-screen4" / "multibank-smoke"
    parser = argparse.ArgumentParser(description="Build an MSX2 SCREEN 4 Konami MegaROM with screen data in a second bank")
    parser.add_argument("--project-root", default=str(root), help="Mideas repository root")
    parser.add_argument("--base-json", default=str(root / "json" / "galaxian_msx2_mideas.json"), help="Base SCREEN 4 project JSON")
    parser.add_argument("--out-dir", default=str(out), help="Output directory for generated fixture and ROM artifacts")
    parser.add_argument("--skip-openmsx", action="store_true", help="Reserved for parity with other smoke scripts; this smoke is static/Glass-only")
    return parser.parse_args()


def make_heavy_tile(tile_index: int, screen_index: int) -> dict:
    pixels = []
    for y in range(8):
        row = []
        for x in range(8):
            row.append(1 + (((x + tile_index * 3) ^ (y * 7 + tile_index * 5 + screen_index * 11)) % 15))
        pixels.append(row)
    return {
        "id": f"heavy8_{screen_index}_{tile_index}",
        "name": f"Heavy8 {screen_index}.{tile_index}",
        "pixels": pixels,
    }


def write_multibank_fixture(base_json: Path, fixture_json: Path) -> None:
    project = json.loads(base_json.read_text(encoding="utf-8"))
    project["name"] = "galaxian_msx2_multibank_smoke"
    screen_assets = [asset for asset in project.get("assets", []) if asset.get("type") == "msx2screen"]
    if len(screen_assets) < 2:
        raise RuntimeError("Base fixture must contain at least two MSX2 SCREEN 4 screens")

    for screen_index, asset in enumerate(screen_assets[:2]):
        data = asset.setdefault("data", {})
        name = "Galaxian Heavy 8x8 A" if screen_index == 0 else "Galaxian Heavy 8x8 B"
        asset["name"] = name
        data["name"] = name
        data["tileSize"] = 8
        data["widthTiles"] = 32
        data["heightTiles"] = 24
        tiles = [make_heavy_tile(tile_index, screen_index) for tile_index in range(192)]
        data["tiles"] = tiles
        data["map"] = [
            [(y * 32 + x) % len(tiles) for x in range(32)]
            for y in range(24)
        ]
        data["layers"] = {
            "collision": [[0 for _x in range(32)] for _y in range(24)],
            "effects": [[0 for _x in range(32)] for _y in range(24)],
            "behavior": [[0 for _x in range(32)] for _y in range(24)],
            "entities": [],
        }
        runtime = data.setdefault("runtime", {})
        runtime["hudWidgets"] = []

    project["assets"] = [
        asset for asset in project.get("assets", [])
        if asset.get("type") != "msx2screen" or asset.get("id") in {screen_assets[0].get("id"), screen_assets[1].get("id")}
    ]

    world = next((asset for asset in project.get("assets", []) if asset.get("type") == "worldmap"), None)
    if not world or not isinstance(world.get("data"), dict):
        raise RuntimeError("Base fixture must contain a worldmap asset")
    world_data = world["data"]
    world_data["nodes"] = [
        {
            "id": "world_node_multibank_a",
            "screenAssetId": screen_assets[0].get("id"),
            "name": "Heavy A",
            "position": {"x": 0, "y": 0},
        },
        {
            "id": "world_node_multibank_b",
            "screenAssetId": screen_assets[1].get("id"),
            "name": "Heavy B",
            "position": {"x": 96, "y": 0},
        },
    ]
    world_data["connections"] = [
        {
            "id": "world_multibank_a_to_b",
            "fromNodeId": "world_node_multibank_a",
            "toNodeId": "world_node_multibank_b",
            "direction": "right",
        }
    ]
    world_data["startScreenNodeId"] = "world_node_multibank_a"

    fixture_json.parent.mkdir(parents=True, exist_ok=True)
    fixture_json.write_text(json.dumps(project, indent=2) + "\n", encoding="utf-8")


def extract_section(asm: str, label: str) -> str:
    match = re.search(rf"{re.escape(label)}:\n(.*?)(?=\nMSX2_SCREEN4_DATA_BANK_\d+_PHYS_START:|\n\s+end\b|\Z)", asm, flags=re.DOTALL)
    if not match:
        raise RuntimeError(f"Missing ASM section: {label}")
    return match.group(1)


def validate_multibank_artifacts(asm_output: Path, rom_output: Path) -> None:
    generated_dir = asm_output.with_name(f"{asm_output.stem}_generated")
    project_slice = json.loads((generated_dir / "project_slice.json").read_text(encoding="utf-8"))
    logical_budget = json.loads((generated_dir / "logical_bank_budget.json").read_text(encoding="utf-8"))
    manifest = json.loads((generated_dir / "msx2_world_bank_manifest.json").read_text(encoding="utf-8"))
    data_plan = project_slice.get("screen4DataBankPlan") or {}

    if int(logical_budget.get("estimatedPackedBankCount") or 0) < 2:
        raise RuntimeError("Multibank smoke did not force at least two estimated packed banks")
    if data_plan.get("supported") is not True or int(data_plan.get("bankCount") or 0) < 2:
        raise RuntimeError(f"SCREEN 4 data bank plan is not supported: {data_plan}")

    target_entry = next((item for item in data_plan.get("screenBanks") or [] if item.get("packageId") == f"msx2screen.{TARGET_SCREEN_ID}"), None)
    if not target_entry:
        raise RuntimeError(f"Missing data-bank plan entry for {TARGET_SCREEN_ID}")
    target_label = str(target_entry.get("label") or "")
    if int(target_entry.get("bankIndex") or -1) != 1 or int(target_entry.get("physicalBank") or -1) != 5:
        raise RuntimeError(f"Target screen must be assigned to bankIndex=1/physicalBank=5: {target_entry}")

    manifest_packages = [
        package
        for world in manifest.get("worlds") or []
        for package in world.get("packages") or []
    ]
    manifest_target = next((package for package in manifest_packages if package.get("packageId") == f"msx2screen.{TARGET_SCREEN_ID}"), None)
    if not manifest_target or int(manifest_target.get("physicalBankIndex") or -1) != 1:
        raise RuntimeError(f"World bank manifest did not assign target screen to physical bank 1: {manifest_target}")
    if manifest_target.get("windowAddress") != "#8000":
        raise RuntimeError(f"Target screen must load through #8000 data window: {manifest_target}")

    asm = asm_output.read_text(encoding="utf-8", errors="replace")
    required = [
        "MSX2_SCREEN4_DATA_BANK_1 EQU 5",
        "MSX2_SCREEN4_DATA_BANK_1_PHYS_START:",
        "MSX2_SCREEN4_DATA_BANK_1_ROM_START:",
        "MSX2_SCREEN4_DATA_BANK_1_USED_END:",
        "org MSX2_SCREEN4_DATA_BANK_1_PHYS_START + #2000",
        f"{target_label}_DATA_BANK EQU MSX2_SCREEN4_DATA_BANK_1",
    ]
    missing = [needle for needle in required if needle not in asm]
    if missing:
        raise RuntimeError("Multibank ASM is missing expected bank-1 signals: " + ", ".join(missing))

    load_match = re.search(rf"load_{re.escape(target_label)}_screen4:\n(.*?)(?=\n[A-Za-z0-9_.$]+:|\Z)", asm, flags=re.DOTALL)
    if not load_match:
        raise RuntimeError(f"Missing load routine for target screen label {target_label}")
    load_body = load_match.group(1)
    for needle in (
        f"ld a, {target_label}_DATA_BANK",
        "call msx2_screen4_data_bank_enter_selected",
        f"ld hl, {target_label}_NAMES",
        f"ld hl, {target_label}_COLLISION",
        "ld de, msx2_collision_runtime_cache",
        "ld bc, msx2_layer_size",
        "ldir",
        f"ld hl, {target_label}_BEHAVIOR",
        "ld de, msx2_behavior_runtime_cache",
        "ld bc, msx2_layer_size",
        "ldir",
        "ld (msx2_current_collision_ptr), hl",
        "ld (msx2_current_behavior_ptr), hl",
        "call msx2_screen4_data_bank_leave",
    ):
        if needle not in load_body:
            raise RuntimeError(f"Target load routine does not use the selected data bank correctly; missing {needle}")
    enter_selected = load_body.find("call msx2_screen4_data_bank_enter_selected")
    collision_copy_start = load_body.find(f"ld hl, {target_label}_COLLISION")
    collision_dest = load_body.find("ld de, msx2_collision_runtime_cache", collision_copy_start)
    collision_size = load_body.find("ld bc, msx2_layer_size", collision_dest)
    collision_ldir = load_body.find("ldir", collision_size)
    behavior_copy_start = load_body.find(f"ld hl, {target_label}_BEHAVIOR")
    behavior_dest = load_body.find("ld de, msx2_behavior_runtime_cache", behavior_copy_start)
    behavior_size = load_body.find("ld bc, msx2_layer_size", behavior_dest)
    behavior_ldir = load_body.find("ldir", behavior_size)
    cache_leave = load_body.find("call msx2_screen4_data_bank_leave", max(collision_copy_start, 0))
    collision_ptr = load_body.find("ld (msx2_current_collision_ptr), hl", cache_leave)
    behavior_ptr = load_body.find("ld (msx2_current_behavior_ptr), hl", cache_leave)
    ordered_cache_steps = [
        enter_selected,
        collision_copy_start,
        collision_dest,
        collision_size,
        collision_ldir,
        behavior_copy_start,
        behavior_dest,
        behavior_size,
        behavior_ldir,
        cache_leave,
        collision_ptr,
        behavior_ptr,
    ]
    if any(position < 0 for position in ordered_cache_steps) or ordered_cache_steps != sorted(ordered_cache_steps):
        raise RuntimeError(
            "Target load routine must copy collision/behavior with LDIR inside the selected data bank "
            "and switch gameplay pointers to RAM caches after leaving it"
        )

    bank0 = extract_section(asm, "MSX2_SCREEN4_DATA_BANK_0_ROM_START")
    bank1 = extract_section(asm, "MSX2_SCREEN4_DATA_BANK_1_ROM_START")
    for suffix in ("_BANK_0_PATTERNS", "_BANK_0_COLORS", "_NAMES", "_COLLISION", "_EFFECTS", "_BEHAVIOR"):
        label = f"{target_label}{suffix}"
        if label not in bank1:
            raise RuntimeError(f"Target cold label {label} is not emitted in data bank 1")
        if label in bank0:
            raise RuntimeError(f"Target cold label {label} leaked into data bank 0")
    resident_match = re.search(r"org\s+#4000\b(.*?)(?:ds\s+#C000\s+-\s*\$,\s*#FF)", asm, flags=re.DOTALL | re.IGNORECASE)
    if resident_match:
        resident_body = resident_match.group(1)
        for suffix in ("_COLLISION", "_BEHAVIOR"):
            label = f"{target_label}{suffix}:"
            if label in resident_body:
                raise RuntimeError(f"Target cold label {label} leaked into resident ROM section")

    rom_size = rom_output.stat().st_size
    if rom_size <= 32768 or rom_size % 8192 != 0:
        raise RuntimeError(f"Multibank ROM size must be MegaROM-sized and 8KB-aligned, got {rom_size}")


def main() -> None:
    args = parse_args()
    project_root = Path(args.project_root).expanduser().resolve()
    base_json = Path(args.base_json).expanduser().resolve()
    out_dir = Path(args.out_dir).expanduser().resolve()
    fixture_json = out_dir / "galaxian_multibank_project.json"
    asm_output = out_dir / "galaxian_multibank.asm"
    rom_output = out_dir / "galaxian_multibank.rom"
    sym_output = out_dir / "galaxian_multibank.sym"

    for path in (
        asm_output,
        rom_output,
        sym_output,
        out_dir / "galaxian_multibank_compressed.asm",
    ):
        if path.exists():
            path.unlink()
    for path in (
        out_dir / "galaxian_multibank_generated",
        out_dir / "galaxian_multibank_compressed_generated",
    ):
        if path.exists():
            shutil.rmtree(path)

    write_multibank_fixture(base_json, fixture_json)
    run_command([
        sys.executable,
        "scripts/build_mideas_unified_rom.py",
        "--json",
        str(fixture_json),
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
    ], cwd=project_root, timeout=180)

    validate_project_slice_artifact(asm_output, expect_stage_banner=True, require_preflight_summary=True)
    validate_multibank_artifacts(asm_output, rom_output)
    print(f"MSX2 SCREEN 4 multibank loader smoke passed: {rom_output}")


if __name__ == "__main__":
    main()
