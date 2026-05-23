#!/usr/bin/env python3
"""Build and smoke-test the Lode Runner MSX2 sprite mirroring path."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from build_msx2screen_layers_smoke import (
    read_png_rgb,
    read_probe_values,
    repo_root_from_script,
    run_command,
)


def parse_args() -> argparse.Namespace:
    root = repo_root_from_script()
    out = root / "test" / "msx2-screen4" / "out"
    parser = argparse.ArgumentParser(description="Build and test Lode Runner MSX2 SCREEN 4 mirror support")
    parser.add_argument("--project-root", default=str(root), help="Mideas repository root")
    parser.add_argument("--json", default=str(root / "json" / "loderunner_msx2_mideas.json"), help="Lode Runner project JSON")
    parser.add_argument("--asm-output", default=str(out / "loderunner_msx2_mirror.asm"), help="Output ASM path")
    parser.add_argument("--rom-output", default=str(out / "loderunner_msx2_mirror.rom"), help="Output ROM path")
    parser.add_argument("--sym-output", default=str(out / "loderunner_msx2_mirror.sym"), help="Output symbols path")
    parser.add_argument("--screenshot-output", default=str(out / "loderunner_msx2_mirror.png"), help="Output OpenMSX screenshot path")
    parser.add_argument("--probe-output", default=str(out / "loderunner_msx2_mirror_probe.txt"), help="Output OpenMSX probe path")
    parser.add_argument("--openmsx", help="Explicit openMSX executable path")
    parser.add_argument("--machine", default="C-BIOS_MSX2", help="OpenMSX machine id")
    parser.add_argument("--skip-openmsx", action="store_true", help="Build and static-check only")
    return parser.parse_args()


def read_project_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Missing Lode Runner project JSON: {path}")
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise RuntimeError("Lode Runner project JSON root must be an object")
    return data


def validate_project_json(path: Path) -> None:
    project = read_project_json(path)
    assets = project.get("assets", [])
    if not isinstance(assets, list):
        raise RuntimeError("Lode Runner project assets must be a list")

    sprites = [asset for asset in assets if asset.get("type") == "msx2sprite"]
    by_id = {asset.get("id"): asset for asset in sprites}
    required_ids = ["sprite_loderunner_player_msx2", "sprite_loderunner_guard_msx2"]
    missing = [asset_id for asset_id in required_ids if asset_id not in by_id]
    if missing:
        raise RuntimeError("Lode Runner project is missing MSX2 sprites: " + ", ".join(missing))

    for asset_id in required_ids:
        data = by_id[asset_id].get("data", {})
        frame_count = len(data.get("frames", []))
        if data.get("facingDirection") != "right":
            raise RuntimeError(f"{asset_id} must be authored facing right for automatic mirror generation")
        if data.get("authoredPerspective") != "side":
            raise RuntimeError(f"{asset_id} must declare side authoredPerspective")
        if frame_count < 1:
            raise RuntimeError(f"{asset_id} must contain at least one sprite frame")

    screen = next((asset for asset in assets if asset.get("id") == "screen_loderunner_msx2_level1"), None)
    behavior = screen.get("data", {}).get("layers", {}).get("behavior") if isinstance(screen, dict) else None
    if not isinstance(behavior, list):
        raise RuntimeError("Lode Runner project is missing the behavior runtime layer")
    flat_behavior = [cell for row in behavior if isinstance(row, list) for cell in row]
    if 1 not in flat_behavior:
        raise RuntimeError("Lode Runner project must keep ladder behavior cells with code 1")
    if 4 not in flat_behavior:
        raise RuntimeError("Lode Runner project must mark rope behavior cells with code 4")


def extract_label_bytes(asm: str, label: str) -> list[int]:
    match = re.search(rf"^{re.escape(label)}:\n(?P<body>(?:    DB .+\n)+)", asm, re.MULTILINE)
    if not match:
        raise RuntimeError(f"Missing ASM label: {label}")
    return [int(token, 16) for token in re.findall(r"#([0-9A-Fa-f]{2})", match.group("body"))]


def validate_asm(path: Path) -> None:
    asm = path.read_text(encoding="utf-8", errors="replace")
    required = [
        "Mideas MSX2 SCREEN 4 tile backend",
        "; ROM Mode: megarom",
        "; Mapper Target: konami",
        "msx2_hw_sprite_frame_0_mirror_pattern_0:",
        "msx2_hw_enemy_sprite_mirror_pattern:",
        "msx2_player_sprite_dx EQU #C002",
        "msx2_enemy_runtime_dx EQU #C2D8",
        "ld a, (msx2_player_sprite_dx)",
        "ld hl, msx2_enemy_runtime_dx",
        "cp #FF",
        "hold_msx2_rope:",
        "msx2_rope_at_player_center:",
        "cp 4",
    ]
    missing = [needle for needle in required if needle not in asm]
    if missing:
        raise RuntimeError("Lode Runner ASM is missing expected mirror runtime signals: " + ", ".join(missing))

    base_labels = re.findall(r"^msx2_hw_sprite_frame_\d+_pattern_\d+:", asm, re.MULTILINE)
    mirror_labels = re.findall(r"^msx2_hw_sprite_frame_\d+_mirror_pattern_\d+:", asm, re.MULTILINE)
    if len(base_labels) < 4 or len(mirror_labels) < 4:
        raise RuntimeError(
            "Lode Runner ASM must emit base and mirrored player metasprite patterns, "
            f"got base={len(base_labels)} mirror={len(mirror_labels)}"
        )
    mirror_offsets = [int(value) for value in re.findall(r"add a, (\d+)\n\.msx2_player_pattern_base_", asm)]
    if not mirror_offsets or not all(value > 0 for value in mirror_offsets):
        raise RuntimeError("Lode Runner ASM must select a positive player mirror pattern offset from msx2_player_sprite_dx")
    enemy_pattern_match = re.search(
        r"ld hl, msx2_enemy_runtime_dx[\s\S]{0,120}?cp #FF[\s\S]{0,120}?ld a, (\d+)[\s\S]{0,120}?ld a, (\d+)",
        asm,
    )
    if not enemy_pattern_match:
        raise RuntimeError("Lode Runner ASM must select base/mirror enemy patterns from msx2_enemy_runtime_dx")
    enemy_base, enemy_mirror = [int(value) for value in enemy_pattern_match.groups()]
    if enemy_mirror <= enemy_base:
        raise RuntimeError(f"Lode Runner enemy mirror pattern index must follow the base index, got {enemy_base}/{enemy_mirror}")

    base = extract_label_bytes(asm, "msx2_hw_sprite_frame_0_pattern_0")
    mirror = extract_label_bytes(asm, "msx2_hw_sprite_frame_0_mirror_pattern_0")
    enemy = extract_label_bytes(asm, "msx2_hw_enemy_sprite_pattern")
    enemy_mirror = extract_label_bytes(asm, "msx2_hw_enemy_sprite_mirror_pattern")
    if len(base) != 32 or len(mirror) != 32 or len(enemy) != 32 or len(enemy_mirror) != 32:
        raise RuntimeError("Hardware sprite patterns must be 32 bytes each")
    if base == mirror:
        raise RuntimeError("Player mirror pattern is identical to the base pattern")
    if enemy == enemy_mirror:
        raise RuntimeError("Enemy mirror pattern is identical to the base pattern")


def validate_rom(path: Path) -> None:
    data = path.read_bytes()
    if len(data) <= 32768 or len(data) % 8192 != 0:
        raise RuntimeError(f"Lode Runner MegaROM size must be >32KB and 8KB-aligned, got {len(data)}")
    if data[:2] != b"AB":
        raise RuntimeError(f"Lode Runner MegaROM header must start with AB, got {data[:2]!r}")


def validate_probe(path: Path) -> None:
    values = read_probe_values(path)
    for key in ("player_x", "player_y", "player_dx", "enemy0_dx", "lives"):
        if key not in values:
            raise RuntimeError(f"Lode Runner OpenMSX probe is missing {key}")
    if values["lives"] != 0x03:
        raise RuntimeError(f"Lode Runner lives probe={values['lives']:02X}, expected 03")
    if values["player_y"] < 0x40:
        raise RuntimeError(f"Lode Runner player Y probe looks invalid: {values['player_y']:02X}")


def validate_screenshot(path: Path) -> None:
    width, height, pixels = read_png_rgb(path)
    non_black = 0
    yellow = 0
    blue = 0
    for row in pixels:
        for r, g, b in row:
            if (r, g, b) != (0, 0, 0):
                non_black += 1
            if r > 180 and g > 160 and b < 80:
                yellow += 1
            if b > 120 and r < 120:
                blue += 1
    if width < 256 or height < 192:
        raise RuntimeError(f"Lode Runner screenshot has unexpected dimensions: {width}x{height}")
    if non_black < 500 or yellow < 20 or blue < 20:
        raise RuntimeError(
            "Lode Runner screenshot does not look like the rendered SCREEN 4 playfield: "
            f"non_black={non_black}, yellow={yellow}, blue={blue}"
        )


def main() -> None:
    args = parse_args()
    project_root = Path(args.project_root).expanduser().resolve()
    project_json = Path(args.json).expanduser().resolve()
    asm_output = Path(args.asm_output).expanduser().resolve()
    rom_output = Path(args.rom_output).expanduser().resolve()
    sym_output = Path(args.sym_output).expanduser().resolve()
    screenshot_output = Path(args.screenshot_output).expanduser().resolve()
    probe_output = Path(args.probe_output).expanduser().resolve()

    validate_project_json(project_json)
    asm_output.parent.mkdir(parents=True, exist_ok=True)
    run_command([
        sys.executable,
        "scripts/build_mideas_unified_rom.py",
        "--json",
        str(project_json),
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
        "--allow-tsc-errors",
    ], cwd=project_root, timeout=180)

    validate_asm(asm_output)
    validate_rom(rom_output)

    if not args.skip_openmsx:
        capture_cmd = [
            sys.executable,
            "scripts/capture_openmsx_action.py",
            "--project-root",
            str(project_root),
            "--rom",
            str(rom_output),
            "--machine",
            args.machine,
            "--romtype",
            "konami",
            "--sequence",
            "WAIT:1200",
            "--boot-wait-ms",
            "6000",
            "--capture-wait-ms",
            "500",
            "--output",
            str(screenshot_output),
            "--probe-output",
            str(probe_output),
            "--probe",
            "player_x:0xC000",
            "--probe",
            "player_y:0xC001",
            "--probe",
            "player_dx:0xC002",
            "--probe",
            "enemy0_dx:0xC2D8",
            "--probe",
            "enemy1_dx:0xC2D9",
            "--probe",
            "lives:0xC011",
        ]
        if args.openmsx:
            capture_cmd.extend(["--openmsx", args.openmsx])
        run_command(capture_cmd, cwd=project_root, timeout=120)
        validate_probe(probe_output)
        validate_screenshot(screenshot_output)

    print(f"Lode Runner MSX2 mirror smoke passed: {rom_output}")


if __name__ == "__main__":
    main()
