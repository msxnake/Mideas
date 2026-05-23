#!/usr/bin/env python3
"""Build and visually smoke-test the MSX2 SCREEN 4 Galaxian Konami MegaROM."""

import argparse
import sys
from pathlib import Path

from build_msx2screen_layers_smoke import (
    read_png_rgb,
    read_probe_values,
    repo_root_from_script,
    run_command,
)


def parse_args() -> argparse.Namespace:
    root = repo_root_from_script()
    out = root / "test" / "msx2-screen4" / "out"
    parser = argparse.ArgumentParser(description="Build and test Galaxian as an MSX2 SCREEN 4 Konami MegaROM")
    parser.add_argument("--project-root", default=str(root), help="Mideas repository root")
    parser.add_argument("--json", default=str(root / "json" / "galaxian_msx2_mideas.json"), help="Galaxian SCREEN 4 project JSON")
    parser.add_argument("--asm-output", default=str(out / "galaxian_msx2_screen4_megarom.asm"), help="Output ASM path")
    parser.add_argument("--rom-output", default=str(out / "galaxian_msx2_screen4_megarom.rom"), help="Output ROM path")
    parser.add_argument("--sym-output", default=str(out / "galaxian_msx2_screen4_megarom.sym"), help="Output symbols path")
    parser.add_argument("--screenshot-output", default=str(out / "galaxian_msx2_screen4_megarom.png"), help="Output OpenMSX screenshot path")
    parser.add_argument("--probe-output", default=str(out / "galaxian_msx2_screen4_megarom_probe.txt"), help="Output OpenMSX probe path")
    parser.add_argument("--openmsx", help="Explicit openmsx executable path")
    parser.add_argument("--machine", default="C-BIOS_MSX2", help="OpenMSX machine id")
    parser.add_argument("--skip-openmsx", action="store_true", help="Build and static-check only")
    return parser.parse_args()


def validate_asm(path: Path) -> None:
    asm = path.read_text(encoding="utf-8", errors="replace")
    required = [
        "Mideas MSX2 SCREEN 4 tile backend",
        "; ROM Mode: megarom",
        "; Mapper Target: konami",
        "MSX2 MegaROM Path: Konami 8K fixed-bank0 compatibility",
        "mapper_set_bank_p1:",
        "mapper_set_bank_p2:",
        "mapper_set_bank_p3:",
        "MSX2_SCREEN4_DATA_BANK EQU 4",
        "init_konami8k_fixed_bank0_banks:",
        "msx2_screen4_data_bank_enter:",
        "msx2_screen4_data_bank_leave:",
        "MSX2_SCREEN4_DATA_BANK_ROM_START:",
        "load_GALAXIAN_SECTOR_1_screen4",
    ]
    missing = [needle for needle in required if needle not in asm]
    if missing:
        raise RuntimeError("Galaxian ASM is missing expected SCREEN 4 MegaROM signals: " + ", ".join(missing))


def validate_rom(path: Path) -> None:
    data = path.read_bytes()
    if len(data) <= 32768 or len(data) % 8192 != 0:
        raise RuntimeError(f"Galaxian MegaROM size must be >32KB and 8KB-aligned, got {len(data)}")
    if data[:2] != b"AB":
        raise RuntimeError(f"Galaxian MegaROM header must start with AB, got {data[:2]!r}")


def validate_probe(path: Path) -> None:
    values = read_probe_values(path)
    expected = {
        "screen": 0x00,
        "lives": 0x03,
        "gameover": 0x00,
    }
    missing = [key for key in ("player_x", "player_y", *expected.keys()) if key not in values]
    if missing:
        raise RuntimeError("Galaxian OpenMSX probe is missing values: " + ", ".join(missing))
    for key, expected_value in expected.items():
        if values[key] != expected_value:
            raise RuntimeError(f"Galaxian probe {key}={values[key]:02X}, expected {expected_value:02X}")
    if values["player_x"] < 0x20 or values["player_y"] < 0x40:
        raise RuntimeError(f"Galaxian player probe looks invalid: x={values['player_x']:02X}, y={values['player_y']:02X}")


def validate_screenshot(path: Path) -> None:
    width, height, pixels = read_png_rgb(path)
    non_black = 0
    magenta_player = 0
    blue_aliens = 0
    for row in pixels:
        for r, g, b in row:
            if (r, g, b) != (0, 0, 0):
                non_black += 1
            if r > 180 and b > 180 and g < 120:
                magenta_player += 1
            if b > 150 and r < 80 and g > 80:
                blue_aliens += 1
    if width < 256 or height < 192:
        raise RuntimeError(f"Galaxian screenshot has unexpected dimensions: {width}x{height}")
    if non_black < 500 or magenta_player < 20 or blue_aliens < 100:
        raise RuntimeError(
            "Galaxian screenshot does not look like the rendered SCREEN 4 playfield: "
            f"non_black={non_black}, magenta_player={magenta_player}, blue_aliens={blue_aliens}"
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
            "WAIT:1000",
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
            "screen:0xC00B",
            "--probe",
            "lives:0xC011",
            "--probe",
            "gameover:0xC012",
        ]
        if args.openmsx:
            capture_cmd.extend(["--openmsx", args.openmsx])
        run_command(capture_cmd, cwd=project_root, timeout=120)
        validate_probe(probe_output)
        validate_screenshot(screenshot_output)

    print(f"Galaxian MSX2 SCREEN 4 Konami MegaROM smoke passed: {rom_output}")


if __name__ == "__main__":
    main()
