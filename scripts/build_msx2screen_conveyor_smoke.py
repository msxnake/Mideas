#!/usr/bin/env python3
"""Dedicated MSX2 behavior-layer conveyor smoke.

This keeps the main layers smoke stable while proving that behavior codes 2
and 3 push the player on real OpenMSX.
"""

import argparse
import json
import sys
from pathlib import Path
from types import SimpleNamespace

from build_msx2screen_layers_smoke import (
    capture_openmsx,
    read_probe_values,
    repo_root_from_script,
    run_command,
    validate_asm,
    validate_rom,
)


def parse_args() -> argparse.Namespace:
    root = repo_root_from_script()
    out = root / "test" / "msx2-screen5" / "out"
    parser = argparse.ArgumentParser(description="Build and test a focused MSX2 conveyor behavior ROM")
    parser.add_argument("--project-root", default=str(root), help="Mideas repository root")
    parser.add_argument("--json-output", default=str(root / "test" / "msx2-screen5" / "msx2screen-conveyor-project.json"), help="Generated conveyor fixture JSON")
    parser.add_argument("--asm-output", default=str(out / "msx2screen-conveyor.asm"), help="Output ASM path")
    parser.add_argument("--rom-output", default=str(out / "msx2screen-conveyor.rom"), help="Output ROM path")
    parser.add_argument("--sym-output", default=str(out / "msx2screen-conveyor.sym"), help="Output symbols path")
    parser.add_argument("--right-screenshot-output", default=str(out / "msx2screen-conveyor-right.png"), help="Output OpenMSX right conveyor screenshot path")
    parser.add_argument("--right-probe-output", default=str(out / "msx2screen-conveyor-right-probe.txt"), help="Output OpenMSX right conveyor RAM probe path")
    parser.add_argument("--left-screenshot-output", default=str(out / "msx2screen-conveyor-left.png"), help="Output OpenMSX left conveyor screenshot path")
    parser.add_argument("--left-probe-output", default=str(out / "msx2screen-conveyor-left-probe.txt"), help="Output OpenMSX left conveyor RAM probe path")
    parser.add_argument("--openmsx", help="Explicit openmsx executable path")
    parser.add_argument("--machine", default="C-BIOS_MSX2", help="OpenMSX machine id")
    parser.add_argument("--sequence", default="WAIT:100", help="Input sequence for capture")
    parser.add_argument("--boot-wait-ms", type=int, default=6000, help="Wait before input replay")
    parser.add_argument("--capture-wait-ms", type=int, default=0, help="Wait before screenshot after input")
    parser.add_argument("--skip-openmsx", action="store_true", help="Build and static-check only")
    return parser.parse_args()


def create_conveyor_fixture(project_root: Path, output_path: Path) -> None:
    run_command(["node", "scripts/create_msx2_screen5_layers_fixture.mjs"], cwd=project_root)
    source_path = project_root / "test" / "msx2-screen5" / "msx2screen-layers-project.json"
    project = json.loads(source_path.read_text(encoding="utf-8"))
    project["name"] = "msx2screen_conveyor_smoke"

    screen_asset = next(asset for asset in project["assets"] if asset.get("id") == "screen_msx2_layers_smoke")
    screen = screen_asset["data"]
    behavior = screen["layers"]["behavior"]
    screen["map"][10][6] = 6
    behavior[10][6] = 2
    screen["map"][10][7] = 6
    behavior[10][7] = 3
    screen["layers"]["entities"] = [
        entity for entity in screen["layers"]["entities"] if entity.get("kind") == "player"
    ]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(project, indent=2) + "\n", encoding="utf-8")


def validate_conveyor_probe(path: Path, direction: str) -> None:
    values = read_probe_values(path)
    missing = [key for key in ("player_x", "player_y", "screen", "gameover") if key not in values]
    if missing:
        raise RuntimeError(f"OpenMSX conveyor probe is missing values: {', '.join(missing)}")
    if values["screen"] != 0 or values["gameover"] != 0:
        raise RuntimeError(
            f"OpenMSX conveyor probe left expected state: "
            f"screen={values['screen']:02X}, gameover={values['gameover']:02X}"
        )
    if direction == "right" and values["player_x"] < 0x68:
        raise RuntimeError(f"OpenMSX right conveyor probe did not push enough: player_x={values['player_x']:02X}")
    if direction == "left" and values["player_x"] > 0x68:
        raise RuntimeError(f"OpenMSX left conveyor probe did not push enough: player_x={values['player_x']:02X}")
    print(
        f"Conveyor {direction} behavior probe check passed: "
        f"player={values['player_x']:02X},{values['player_y']:02X}, screen={values['screen']:02X}"
    )


def main() -> None:
    args = parse_args()
    project_root = Path(args.project_root).expanduser().resolve()
    project_json = Path(args.json_output).expanduser().resolve()
    asm_output = Path(args.asm_output).expanduser().resolve()
    rom_output = Path(args.rom_output).expanduser().resolve()
    sym_output = Path(args.sym_output).expanduser().resolve()
    right_screenshot_output = Path(args.right_screenshot_output).expanduser().resolve()
    right_probe_output = Path(args.right_probe_output).expanduser().resolve()
    left_screenshot_output = Path(args.left_screenshot_output).expanduser().resolve()
    left_probe_output = Path(args.left_probe_output).expanduser().resolve()

    create_conveyor_fixture(project_root, project_json)
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
    ], cwd=project_root, timeout=180)
    validate_asm(asm_output)
    validate_rom(rom_output)

    if args.skip_openmsx:
        print("OpenMSX capture skipped by --skip-openmsx")
        print(f"ROM ready: {rom_output} ({rom_output.stat().st_size} bytes)")
        return

    capture_args = SimpleNamespace(
        machine=args.machine,
        boot_wait_ms=args.boot_wait_ms,
        openmsx=args.openmsx,
    )
    capture_openmsx(capture_args, project_root, rom_output, right_screenshot_output, args.sequence, args.capture_wait_ms, right_probe_output)
    capture_openmsx(capture_args, project_root, rom_output, left_screenshot_output, "RIGHT:600,WAIT:100", args.capture_wait_ms, left_probe_output)
    validate_conveyor_probe(right_probe_output, "right")
    validate_conveyor_probe(left_probe_output, "left")
    print(f"OpenMSX right conveyor screenshot ready: {right_screenshot_output}")
    print(f"OpenMSX right conveyor probe ready: {right_probe_output}")
    print(f"OpenMSX left conveyor screenshot ready: {left_screenshot_output}")
    print(f"OpenMSX left conveyor probe ready: {left_probe_output}")


if __name__ == "__main__":
    main()
