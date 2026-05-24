#!/usr/bin/env python3
import argparse
import subprocess
import sys
from pathlib import Path


def repo_root_from_script() -> Path:
    return Path(__file__).resolve().parents[1]


def run_command(cmd: list[str], cwd: Path, timeout: float | None = None) -> subprocess.CompletedProcess:
    print("Running:", " ".join(str(part) for part in cmd))
    completed = subprocess.run(cmd, cwd=str(cwd), capture_output=True, timeout=timeout)
    stdout = completed.stdout.decode("utf-8", errors="replace")
    stderr = completed.stderr.decode("utf-8", errors="replace")
    if stdout.strip():
        print(stdout.strip())
    if stderr.strip():
        print(stderr.strip(), file=sys.stderr)
    if completed.returncode != 0:
        raise RuntimeError(f"Command failed ({completed.returncode}): {' '.join(str(part) for part in cmd)}")
    return completed


def assert_contains(path: Path, needle: str, description: str) -> None:
    text = path.read_text(encoding="utf-8", errors="replace")
    if needle not in text:
        raise RuntimeError(f"Generated ASM is missing {description}: {needle}")


def assert_not_contains(path: Path, needle: str, description: str) -> None:
    text = path.read_text(encoding="utf-8", errors="replace")
    if needle in text:
        raise RuntimeError(f"Generated ASM must not contain {description}: {needle}")


def assert_screen5_mode_contract(path: Path) -> None:
    text = path.read_text(encoding="utf-8", errors="replace")
    normalized = "\n".join(line.strip().lower() for line in text.splitlines())
    if "ld a, 5\ncall chgmod" not in normalized:
        raise RuntimeError("Generated ASM does not switch to SCREEN 5 with CHGMOD")
    if "ld a, 4\ncall chgmod" in normalized:
        raise RuntimeError("Generated ASM must not switch to SCREEN 4 with CHGMOD")
    assert_not_contains(path, "call INIGRP", "SCREEN 4 BIOS initialization fallback")
    assert_not_contains(path, "screen4_", "SCREEN 4 labels in SCREEN 5 presentation smoke")


def assert_screen5_generated_labels(path: Path) -> None:
    text = path.read_text(encoding="utf-8", errors="replace")
    required_labels = [
        "SCREEN5_PRESENTATION_BITMAP_SIZE EQU 27136",
        "screen5_presentation_palette_data:",
        "SCREEN5_PRESENTATION_BITMAP_CHUNK_0:",
    ]
    for label in required_labels:
        if label not in text:
            raise RuntimeError(f"Generated ASM is missing SCREEN5 label: {label}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build and optionally capture the MSX2 SCREEN 5 presentation smoke ROM.")
    parser.add_argument("--project-root", default=".", help="Mideas repository root")
    parser.add_argument("--skip-openmsx", action="store_true", help="Compile only; do not launch OpenMSX")
    parser.add_argument("--machine", default="C-BIOS_MSX2", help="OpenMSX machine")
    parser.add_argument("--wait-ms", type=int, default=6000, help="OpenMSX capture wait in milliseconds")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()
    if not (project_root / "package.json").exists():
        project_root = repo_root_from_script()

    fixture = project_root / "test" / "msx2-screen5-presentation" / "presentation_screen5_project.json"
    out_dir = project_root / "test" / "msx2-screen5-presentation" / "out"
    out_dir.mkdir(parents=True, exist_ok=True)
    asm_output = out_dir / "msx2_screen5_presentation.asm"
    rom_output = out_dir / "msx2_screen5_presentation.rom"
    sym_output = out_dir / "msx2_screen5_presentation.sym"
    screenshot_output = out_dir / "msx2_screen5_presentation.png"

    run_command([
        sys.executable,
        "scripts/build_mideas_unified_rom.py",
        "--json", str(fixture),
        "--project-root", str(project_root),
        "--project-name", "msx2_screen5_presentation_smoke",
        "--asm-output", str(asm_output),
        "--rom-output", str(rom_output),
        "--sym-output", str(sym_output),
        "--rom-mode", "simple32k",
        "--target-format", "konami",
        "--execution-mode", "gameLoopHalt",
    ], cwd=project_root, timeout=180)

    assert_contains(asm_output, "Backend: msx2-screen5-presentation", "SCREEN 5 presentation backend marker")
    assert_contains(asm_output, "ld a, 5", "SCREEN 5 mode switch")
    assert_contains(asm_output, "screen5_presentation_palette_data", "SCREEN 5 palette data")
    assert_contains(asm_output, "SCREEN5_PRESENTATION_BITMAP_CHUNK_0", "SCREEN 5 bitmap chunk data")
    assert_contains(asm_output, "SCREEN5_PRESENTATION_BITMAP_SIZE EQU 27136", "full 256x212 bitmap upload")
    assert_contains(asm_output, "call map_page2_to_cart_primary", "page-2 cart mapping for bitmap data crossing #8000")
    assert_screen5_mode_contract(asm_output)
    assert_screen5_generated_labels(asm_output)

    size = rom_output.stat().st_size
    if size % 8192 != 0:
        raise RuntimeError(f"ROM size is not a multiple of 8KB: {size}")
    print(f"ROM ready: {rom_output} ({size} bytes)")

    if not args.skip_openmsx:
        run_command([
            "powershell",
            "-ExecutionPolicy", "Bypass",
            "-File", "scripts\\capture_openmsx_screenshot.ps1",
            "-Rom", str(rom_output),
            "-ProjectRoot", str(project_root),
            "-Output", str(screenshot_output),
            "-WaitMs", str(args.wait_ms),
            "-Machine", args.machine,
        ], cwd=project_root, timeout=120)
        print(f"Screenshot: {screenshot_output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
