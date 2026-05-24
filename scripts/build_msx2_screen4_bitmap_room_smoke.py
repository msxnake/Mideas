#!/usr/bin/env python3
"""Build a minimal MSX2 SCREEN 4 Bitmap Room smoke ROM.

This verifies the authoring workflow where a pixel/atlas composition is exported
as real SCREEN 4 pattern, name and color tables.
"""

import argparse
import json
import re
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
        sys.stdout.buffer.write((stdout.strip() + "\n").encode(sys.stdout.encoding or "utf-8", errors="replace"))
        sys.stdout.flush()
    if stderr.strip():
        sys.stderr.buffer.write((stderr.strip() + "\n").encode(sys.stderr.encoding or "utf-8", errors="replace"))
        sys.stderr.flush()
    if completed.returncode != 0:
        raise RuntimeError(f"Command failed ({completed.returncode}): {' '.join(str(part) for part in cmd)}")
    return completed


def parse_args() -> argparse.Namespace:
    root = repo_root_from_script()
    out = root / "test" / "msx2-screen4" / "out"
    parser = argparse.ArgumentParser(description="Build an MSX2 SCREEN 4 Bitmap Room smoke project")
    parser.add_argument("--project-root", default=str(root), help="Mideas repository root")
    parser.add_argument("--json-output", default=str(out / "msx2_bitmap_room_smoke.json"), help="Output project JSON path")
    parser.add_argument("--asm-output", default=str(out / "msx2_bitmap_room_smoke.asm"), help="Output ASM path")
    parser.add_argument("--rom-output", default=str(out / "msx2_bitmap_room_smoke.rom"), help="Output ROM path")
    parser.add_argument("--screenshot-output", default=str(out / "msx2_bitmap_room_smoke_pattern.png"), help="Output OpenMSX screenshot path")
    parser.add_argument("--skip-openmsx", action="store_true", help="Compile only")
    parser.add_argument("--boot-wait-ms", type=int, default=8000, help="Wait before screenshot")
    return parser.parse_args()


def default_palette() -> list[dict[str, object]]:
    return [
        {"slotIndex": 0, "masterIndex": -1, "hex": "rgba(0,0,0,0)"},
        {"slotIndex": 1, "masterIndex": 0, "hex": "#000000"},
        {"slotIndex": 2, "masterIndex": 113, "hex": "#24DB24"},
        {"slotIndex": 3, "masterIndex": 251, "hex": "#6DFF6D"},
        {"slotIndex": 4, "masterIndex": 79, "hex": "#2424FF"},
        {"slotIndex": 5, "masterIndex": 159, "hex": "#496DFF"},
        {"slotIndex": 6, "masterIndex": 329, "hex": "#B62424"},
        {"slotIndex": 7, "masterIndex": 183, "hex": "#49DBFF"},
        {"slotIndex": 8, "masterIndex": 457, "hex": "#FF2424"},
        {"slotIndex": 9, "masterIndex": 475, "hex": "#FF6D6D"},
        {"slotIndex": 10, "masterIndex": 433, "hex": "#DBDB24"},
        {"slotIndex": 11, "masterIndex": 436, "hex": "#DBDB92"},
        {"slotIndex": 12, "masterIndex": 97, "hex": "#249224"},
        {"slotIndex": 13, "masterIndex": 405, "hex": "#DB49B6"},
        {"slotIndex": 14, "masterIndex": 365, "hex": "#B6B6B6"},
        {"slotIndex": 15, "masterIndex": 511, "hex": "#FFFFFF"},
    ]


def build_atlas_pixels(width: int = 64, height: int = 32) -> list[list[int]]:
    pixels = [[0 for _x in range(width)] for _y in range(height)]

    for y in range(16):
        for x in range(16):
            if x in (0, 15) or y in (0, 15):
                pixels[y][x] = 4
            elif (x + y) % 2 == 0:
                pixels[y][x] = 4
            else:
                pixels[y][x] = 5

    for y in range(16):
        for x in range(16, 32):
            pixels[y][x] = 13 if y < 6 else 10 if y < 10 else 11

    return pixels


def build_project() -> dict[str, object]:
    atlas_pixels = build_atlas_pixels()
    return {
        "name": "msx2_bitmap_room_smoke",
        "currentScreenMode": "SCREEN 4 (Graphics II)",
        "screenMode": "SCREEN 4 (Graphics II)",
        "targetGraphicsBackend": "msx2-screen4-bitmap-room",
        "assets": [
            {
                "id": "bitmap_room_smoke",
                "name": "Bitmap Room Smoke",
                "type": "msx2bitmaproom",
                "data": {
                    "id": "bitmap_room_smoke",
                    "name": "Bitmap Room Smoke",
                    "target": "MSX2",
                    "vdpMode": "SCREEN4_BITMAP_ROOM",
                    "width": 256,
                    "height": 192,
                    "palette": default_palette(),
                    "atlas": {
                        "width": 64,
                        "height": 32,
                        "offscreenBaseY": 320,
                        "pixels": atlas_pixels,
                        "entries": [
                            {"id": "blue_checker", "name": "Blue Checker 16x16", "sx": 0, "sy": 0, "w": 16, "h": 16},
                            {"id": "stripe_block", "name": "Stripe Block 16x16", "sx": 16, "sy": 0, "w": 16, "h": 16},
                        ],
                    },
                    "composition": {
                        "source": "authored",
                        "commands": [
                            {"id": "fill_backdrop", "op": "fill", "x": 0, "y": 0, "w": 256, "h": 192, "color": 1},
                            {"id": "checker_a", "op": "copy", "atlasEntryId": "blue_checker", "dx": 32, "dy": 32, "w": 16, "h": 16},
                            {"id": "stripe", "op": "copy", "atlasEntryId": "stripe_block", "dx": 56, "dy": 32, "w": 16, "h": 16},
                            {"id": "checker_b", "op": "copy", "atlasEntryId": "blue_checker", "dx": 80, "dy": 32, "w": 16, "h": 16},
                            {"id": "floor", "op": "lineH", "x": 0, "y": 191, "length": 256, "color": 15},
                        ],
                    },
                    "collision": [[0 for _x in range(16)] for _y in range(12)],
                    "effects": [[0 for _x in range(16)] for _y in range(12)],
                    "behavior": [[0 for _x in range(16)] for _y in range(12)],
                    "entities": [],
                    "notes": "Smoke for SCREEN 4 pattern-bitmap room export.",
                },
            }
        ],
    }


def render_smoke_bitmap_room(project: dict[str, object]) -> list[list[int]]:
    room = project["assets"][0]["data"]
    width = int(room["width"])
    height = int(room["height"])
    pixels = [[0 for _x in range(width)] for _y in range(height)]
    atlas = room["atlas"]
    atlas_pixels = atlas["pixels"]
    entries = {entry["id"]: entry for entry in atlas["entries"]}

    for command in room["composition"]["commands"]:
        op = command["op"]
        if op == "fill":
            color = int(command.get("color", 0))
            x0 = int(command.get("x", 0))
            y0 = int(command.get("y", 0))
            w = int(command.get("w", 0))
            h = int(command.get("h", 0))
            for y in range(max(0, y0), min(height, y0 + h)):
                for x in range(max(0, x0), min(width, x0 + w)):
                    pixels[y][x] = color
        elif op == "lineH":
            color = int(command.get("color", 0))
            y = int(command.get("y", 0))
            if 0 <= y < height:
                x0 = int(command.get("x", 0))
                length = int(command.get("length", 0))
                for x in range(max(0, x0), min(width, x0 + length)):
                    pixels[y][x] = color
        elif op == "copy":
            entry = entries[command["atlasEntryId"]]
            sx = int(entry["sx"])
            sy = int(entry["sy"])
            w = int(command.get("w", entry["w"]))
            h = int(command.get("h", entry["h"]))
            dx = int(command.get("dx", 0))
            dy = int(command.get("dy", 0))
            for y in range(h):
                ty = dy + y
                ay = sy + y
                if not (0 <= ty < height and 0 <= ay < len(atlas_pixels)):
                    continue
                for x in range(w):
                    tx = dx + x
                    ax = sx + x
                    if 0 <= tx < width and 0 <= ax < len(atlas_pixels[ay]):
                        pixels[ty][tx] = int(atlas_pixels[ay][ax])
        else:
            raise RuntimeError(f"Unsupported smoke composition command: {op}")

    return pixels


def validate_screen4_color_rows(pixels: list[list[int]]) -> None:
    for y, row in enumerate(pixels):
        for x in range(0, len(row), 8):
            colors = sorted(set(row[x:x + 8]))
            if len(colors) > 2:
                raise RuntimeError(
                    f"SCREEN 4 Bitmap Room smoke fixture exceeds 2 colors at y={y}, x={x}: {colors}"
                )


def extract_db_bytes(asm_text: str, label: str) -> list[int]:
    match = re.search(rf"^{re.escape(label)}:\s*$", asm_text, flags=re.MULTILINE)
    if not match:
        raise RuntimeError(f"Generated ASM is missing label: {label}")
    bytes_out: list[int] = []
    for line in asm_text[match.end():].splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if not stripped.upper().startswith("DB "):
            break
        for token in stripped[3:].split(","):
            value = token.strip()
            if value.startswith("#"):
                bytes_out.append(int(value[1:], 16))
            else:
                bytes_out.append(int(value, 10))
    return bytes_out


def validate_generated_asm_tables(asm_text: str) -> None:
    expected_lengths = {
        "screen4_bitmap_palette_data": 32,
        "screen4_pattern_data": 6144,
        "screen4_name_data": 768,
        "screen4_color_data": 6144,
    }
    for label, expected_length in expected_lengths.items():
        actual_length = len(extract_db_bytes(asm_text, label))
        if actual_length != expected_length:
            raise RuntimeError(f"{label} has {actual_length} bytes; expected {expected_length}")


def main() -> int:
    args = parse_args()
    project_root = Path(args.project_root).resolve()
    json_output = Path(args.json_output).resolve()
    asm_output = Path(args.asm_output).resolve()
    rom_output = Path(args.rom_output).resolve()
    screenshot_output = Path(args.screenshot_output).resolve()

    project = build_project()
    validate_screen4_color_rows(render_smoke_bitmap_room(project))

    json_output.parent.mkdir(parents=True, exist_ok=True)
    json_output.write_text(json.dumps(project, indent=2) + "\n", encoding="utf-8")
    print(f"Project JSON written: {json_output}")

    run_command([
        sys.executable,
        str(project_root / "scripts" / "build_mideas_unified_rom.py"),
        "--json",
        str(json_output),
        "--project-root",
        str(project_root),
        "--asm-output",
        str(asm_output),
        "--rom-output",
        str(rom_output),
        "--allow-tsc-errors",
    ], cwd=project_root, timeout=180)

    asm_text = asm_output.read_text(encoding="utf-8")
    for marker in ("screen4_pattern_data", "screen4_name_data", "screen4_color_data", "Mideas MSX2 SCREEN 4 pattern-bitmap room backend"):
        if marker not in asm_text:
            raise RuntimeError(f"Generated ASM is missing marker: {marker}")
    validate_generated_asm_tables(asm_text)

    if not args.skip_openmsx:
        run_command([
            "powershell",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(project_root / "scripts" / "capture_openmsx_screenshot.ps1"),
            "-Rom",
            str(rom_output),
            "-ProjectRoot",
            str(project_root),
            "-Output",
            str(screenshot_output),
            "-WaitMs",
            str(args.boot_wait_ms),
        ], cwd=project_root, timeout=90)
        if not screenshot_output.exists() or screenshot_output.stat().st_size == 0:
            raise RuntimeError(f"OpenMSX screenshot was not produced: {screenshot_output}")
        print(f"Screenshot ready: {screenshot_output}")

    print(f"Smoke ROM ready: {rom_output} ({rom_output.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
