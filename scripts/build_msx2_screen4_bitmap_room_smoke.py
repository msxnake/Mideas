#!/usr/bin/env python3
"""Build a minimal MSX2 SCREEN 4 Bitmap Room smoke ROM.

This verifies the authoring workflow where atlas pixels and composition commands
are exported as a V9938 bitmap-room runtime (VRAM page + command engine).
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


BRICK_VARIANTS = [
    ("brick_red", 8),
    ("brick_orange", 9),
    ("brick_yellow", 10),
    ("brick_green", 12),
    ("brick_cyan", 7),
    ("brick_blue", 5),
    ("brick_magenta", 13),
    ("brick_white", 15),
]


def build_atlas_pixels(width: int = 128, height: int = 16) -> list[list[int]]:
    pixels = [[0 for _x in range(width)] for _y in range(height)]

    mortar = 1
    for variant_index, (_brick_id, color) in enumerate(BRICK_VARIANTS):
        x0 = variant_index * 16
        for y in range(16):
            for x in range(16):
                split = 8 if y < 8 else 0
                is_mortar = y in (0, 8, 15) or x in (0, 15) or x == split
                pixels[y][x0 + x] = mortar if is_mortar else color

    return pixels


def build_brick_entries() -> list[dict[str, object]]:
    return [
        {"id": brick_id, "name": brick_id.replace("_", " ").title(), "sx": index * 16, "sy": 0, "w": 16, "h": 16}
        for index, (brick_id, _color) in enumerate(BRICK_VARIANTS)
    ]


def build_castle_commands() -> list[dict[str, object]]:
    commands: list[dict[str, object]] = []

    def rect(id_: str, x: int, y: int, w: int, h: int, color: int) -> None:
        commands.append({"id": id_, "op": "fill", "x": x, "y": y, "w": w, "h": h, "color": color})

    def brick_area(id_: str, x: int, y: int, w: int, h: int, color: int, highlight: int, shadow: int) -> None:
        rect(f"{id_}_base", x, y, w, h, color)
        for yy in range(y, y + h, 8):
            row_h = min(8, y + h - yy)
            rect(f"{id_}_hi_{yy}", x, yy, w, 2, highlight)
            if row_h >= 7:
                rect(f"{id_}_sh_{yy}", x, yy + 6, w, 2, shadow)
            rect(f"{id_}_mortar_h_{yy}", x, yy, w, 1, 1)
        for xx in range(x + 16, x + w, 16):
            rect(f"{id_}_mortar_v_{xx}", xx, y, 1, h, 1)

    def platform(id_: str, x: int, y: int, w: int) -> None:
        rect(f"{id_}_shadow", x, y + 5, w, 3, 4)
        rect(f"{id_}_top", x, y, w, 3, 15)

    def ladder(id_: str, x: int, y: int, h: int) -> None:
        rect(f"{id_}_left", x, y, 2, h, 6)
        rect(f"{id_}_right", x + 8, y, 2, h, 6)
        for yy in range(y + 4, y + h, 8):
            rect(f"{id_}_rung_{yy}", x, yy, 10, 2, 10)

    def window(id_: str, x: int, y: int) -> None:
        rect(f"{id_}_outline", x, y + 6, 15, 28, 7)
        rect(f"{id_}_void", x + 2, y + 8, 11, 24, 1)
        rect(f"{id_}_cap1", x + 3, y + 3, 9, 4, 7)
        rect(f"{id_}_cap2", x + 5, y, 5, 3, 7)
        rect(f"{id_}_bars", x + 7, y + 7, 1, 25, 5)

    def barrel(id_: str, x: int, y: int) -> None:
        rect(f"{id_}_body", x, y, 12, 17, 6)
        rect(f"{id_}_dark", x + 2, y + 2, 8, 13, 1)
        rect(f"{id_}_slat1", x + 4, y + 2, 2, 13, 9)
        rect(f"{id_}_slat2", x + 8, y + 2, 2, 13, 9)
        rect(f"{id_}_band1", x + 1, y + 5, 10, 1, 15)
        rect(f"{id_}_band2", x + 1, y + 11, 10, 1, 15)

    def torch(id_: str, x: int, y: int) -> None:
        rect(f"{id_}_pole", x + 4, y + 8, 2, 25, 10)
        rect(f"{id_}_base", x, y + 31, 10, 2, 15)
        rect(f"{id_}_flame1", x + 2, y + 2, 6, 6, 10)
        rect(f"{id_}_flame2", x + 4, y, 3, 10, 8)
        rect(f"{id_}_wick", x + 4, y + 6, 2, 5, 15)

    # Dark brick hall.
    brick_area("back_wall", 0, 0, 256, 192, 4, 7, 5)
    brick_area("left_tower", 0, 80, 64, 112, 7, 15, 5)
    brick_area("left_column", 0, 0, 17, 82, 7, 15, 5)
    brick_area("floor", 64, 154, 118, 38, 7, 15, 5)
    brick_area("right_lower", 176, 160, 64, 32, 4, 7, 5)
    brick_area("right_wall", 220, 78, 36, 82, 7, 15, 5)
    brick_area("mid_block", 144, 58, 32, 32, 7, 15, 5)
    brick_area("top_trim", 144, 0, 112, 8, 7, 15, 5)

    platform("left_platform", 16, 77, 64)
    platform("left_mid_platform", 50, 104, 32)
    platform("center_floor", 84, 146, 96)
    platform("mid_platform", 144, 54, 32)
    platform("right_platform", 176, 48, 80)

    ladder("left_ladder", 17, 0, 80)
    ladder("right_ladder", 232, 74, 86)

    window("window_a", 66, 22)
    window("window_b", 114, 22)
    barrel("barrel_left", 50, 92)
    barrel("barrel_top", 210, 51)
    barrel("barrel_bottom", 178, 162)
    torch("torch_left", 112, 122)
    torch("torch_right", 178, 122)
    rect("small_bat_left", 43, 66, 9, 5, 1)
    rect("small_bat_right", 199, 88, 9, 5, 14)
    rect("barrel_blue", 232, 166, 12, 24, 5)
    rect("curtain_red", 248, 166, 8, 26, 8)
    return commands


def build_project() -> dict[str, object]:
    atlas_pixels = build_atlas_pixels()
    commands = build_castle_commands()
    room_data = {
        "id": "bitmap_room_smoke",
        "name": "Bitmap Room Smoke",
        "target": "MSX2",
        "vdpMode": "SCREEN4_BITMAP_ROOM",
        "width": 256,
        "height": 192,
        "palette": default_palette(),
        "atlas": {
            "width": 128,
            "height": 16,
            "offscreenBaseY": 320,
            "pixels": atlas_pixels,
            "entries": build_brick_entries(),
        },
        "composition": {
            "source": "authored",
            "commands": commands,
        },
        "collision": [[0 for _x in range(16)] for _y in range(12)],
        "effects": [[0 for _x in range(16)] for _y in range(12)],
        "behavior": [[0 for _x in range(16)] for _y in range(12)],
        "entities": [],
        "notes": "Smoke for SCREEN 4 V9938 bitmap-room export.",
    }
    room_data["visibleFramebuffer"] = {
        "source": "pre-rendered",
        "pixels": render_smoke_room_data(room_data),
    }
    room_data["composition"] = {"source": "authored", "commands": []}
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
                "data": room_data,
            }
        ],
    }


def render_smoke_room_data(room: dict[str, object]) -> list[list[int]]:
    width = int(room["width"])
    height = int(room["height"])
    pixels = [[0 for _x in range(width)] for _y in range(height)]
    for command in room["composition"]["commands"]:
        op = command["op"]
        if op == "fill":
            color = int(command.get("color", 0)) & 0x0F
            x0 = int(command.get("x", 0))
            y0 = int(command.get("y", 0))
            w = int(command.get("w", 0))
            h = int(command.get("h", 0))
            for y in range(max(0, y0), min(height, y0 + h)):
                for x in range(max(0, x0), min(width, x0 + w)):
                    pixels[y][x] = color
        elif op == "lineH":
            color = int(command.get("color", 0)) & 0x0F
            y = int(command.get("y", 0))
            if 0 <= y < height:
                x0 = int(command.get("x", 0))
                length = int(command.get("length", 0))
                for x in range(max(0, x0), min(width, x0 + length)):
                    pixels[y][x] = color
        elif op == "lineV":
            color = int(command.get("color", 0)) & 0x0F
            x = int(command.get("x", 0))
            if 0 <= x < width:
                y0 = int(command.get("y", 0))
                length = int(command.get("length", 0))
                for y in range(max(0, y0), min(height, y0 + length)):
                    pixels[y][x] = color
    return pixels


def render_smoke_bitmap_room(project: dict[str, object]) -> list[list[int]]:
    room = project["assets"][0]["data"]
    framebuffer = room.get("visibleFramebuffer")
    if isinstance(framebuffer, dict) and isinstance(framebuffer.get("pixels"), list):
        return framebuffer["pixels"]
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


def validate_bitmap_palette_indices(pixels: list[list[int]]) -> None:
    for y, row in enumerate(pixels):
        for x, color in enumerate(row):
            if not 0 <= int(color) <= 15:
                raise RuntimeError(f"Bitmap Room smoke fixture has invalid palette index at y={y}, x={x}: {color}")


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


def validate_generated_asm_tables(asm_text: str, project: dict[str, object]) -> None:
    for marker in (
        "Bitmap room HUD height: 16 px",
        "Bitmap room game area: 256x192 at visual Y=16",
        "The first 16 scanlines are reserved for HUD",
        "add a, 16",
    ):
        if marker not in asm_text:
            raise RuntimeError(f"Generated ASM is missing bitmap-room HUD marker: {marker}")

    palette_length = len(extract_db_bytes(asm_text, "screen4_bitmap_palette_data"))
    if palette_length != 32:
        raise RuntimeError(f"screen4_bitmap_palette_data has {palette_length} bytes; expected 32")

    rle_chunks = re.findall(r"^bitmap_room_framebuffer_rle_chunk_\d+:\s*$", asm_text, flags=re.MULTILINE)
    if not rle_chunks:
        raise RuntimeError("Generated ASM is missing bitmap_room_framebuffer_rle_chunk_* data")
    decoded_length = 0
    encoded_length = 0
    for chunk_label in (chunk.split(":", 1)[0] for chunk in rle_chunks):
        chunk_bytes = extract_db_bytes(asm_text, chunk_label)
        if len(chunk_bytes) % 2 != 0:
            raise RuntimeError(f"{chunk_label} has odd RLE byte length: {len(chunk_bytes)}")
        encoded_length += len(chunk_bytes)
        for index in range(0, len(chunk_bytes), 2):
            decoded_length += chunk_bytes[index]
    expected_framebuffer_length = 256 * 212 // 2
    if decoded_length != expected_framebuffer_length:
        raise RuntimeError(
            f"bitmap room RLE decodes to {decoded_length} bytes; expected {expected_framebuffer_length}"
        )
    if encoded_length >= expected_framebuffer_length:
        raise RuntimeError(
            f"bitmap room RLE did not reduce resident source data: encoded={encoded_length}, raw={expected_framebuffer_length}"
        )


def main() -> int:
    args = parse_args()
    project_root = Path(args.project_root).resolve()
    json_output = Path(args.json_output).resolve()
    asm_output = Path(args.asm_output).resolve()
    rom_output = Path(args.rom_output).resolve()
    screenshot_output = Path(args.screenshot_output).resolve()

    project = build_project()
    validate_bitmap_palette_indices(render_smoke_bitmap_room(project))

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
    for marker in (
        "init_screen4_bitmap_vdp",
        "upload_bitmap_framebuffer",
        "bitmap_room_framebuffer_data",
        "Mideas MSX2 SCREEN 4 bitmap room backend (V9938 command engine)",
    ):
        if marker not in asm_text:
            raise RuntimeError(f"Generated ASM is missing marker: {marker}")
    validate_generated_asm_tables(asm_text, project)

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
