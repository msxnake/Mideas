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

SMOKE_HUD_FONT_PATTERNS = {
    " ": [0, 0, 0, 0, 0, 0, 0, 0],
    "0": [0x3C, 0x66, 0x6E, 0x76, 0x66, 0x66, 0x3C, 0],
    "1": [0x18, 0x38, 0x18, 0x18, 0x18, 0x18, 0x7E, 0],
    "2": [0x3C, 0x66, 0x06, 0x1C, 0x30, 0x60, 0x7E, 0],
    "3": [0x3C, 0x66, 0x06, 0x1C, 0x06, 0x66, 0x3C, 0],
    "4": [0x0C, 0x1C, 0x3C, 0x6C, 0x7E, 0x0C, 0x0C, 0],
    "5": [0x7E, 0x60, 0x7C, 0x06, 0x06, 0x66, 0x3C, 0],
    "6": [0x1C, 0x30, 0x60, 0x7C, 0x66, 0x66, 0x3C, 0],
    "7": [0x7E, 0x06, 0x0C, 0x18, 0x30, 0x30, 0x30, 0],
    "8": [0x3C, 0x66, 0x66, 0x3C, 0x66, 0x66, 0x3C, 0],
    "9": [0x3C, 0x66, 0x66, 0x3E, 0x06, 0x0C, 0x38, 0],
    "A": [0x18, 0x3C, 0x66, 0x66, 0x7E, 0x66, 0x66, 0],
    "E": [0x7E, 0x60, 0x60, 0x7C, 0x60, 0x60, 0x7E, 0],
    "G": [0x3C, 0x66, 0x60, 0x6E, 0x66, 0x66, 0x3C, 0],
    "I": [0x7E, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7E, 0],
    "L": [0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x7E, 0],
    "M": [0x63, 0x77, 0x7F, 0x6B, 0x63, 0x63, 0x63, 0],
    "S": [0x3C, 0x66, 0x60, 0x3C, 0x06, 0x66, 0x3C, 0],
    "T": [0x7E, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0],
}


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


def build_player_sprite_frame(frame_index: int) -> list[list[str]]:
    transparent = "rgba(0,0,0,0)"
    primary = "#FFFFFF"
    accent = "#FF2424" if frame_index == 0 else "#24DB24"
    pixels = [[transparent for _x in range(16)] for _y in range(16)]
    for y in range(2, 15):
        for x in range(4, 11):
            pixels[y][x] = primary
    # Asymmetric arm/nose: this makes mirrored pattern generation observable.
    for y in range(5, 9):
        for x in range(10, 15):
            pixels[y][x] = accent
    # Different leg pose per frame: this makes animation data observable.
    leg_x = 5 if frame_index == 0 else 8
    for y in range(12, 16):
        pixels[y][leg_x] = accent
    return pixels


def build_player_sprite_asset() -> dict[str, object]:
    return {
        "id": "smoke_player_sprite",
        "name": "Smoke Player Sprite",
        "type": "msx2sprite",
        "data": {
            "id": "smoke_player_sprite",
            "name": "Smoke Player Sprite",
            "target": "MSX2",
            "vdpMode": "SCREEN5",
            "size": {"width": 16, "height": 16},
            "palette": default_palette(),
            "backgroundColor": "rgba(0,0,0,0)",
            "frames": [
                {"id": "frame_0", "data": build_player_sprite_frame(0)},
                {"id": "frame_1", "data": build_player_sprite_frame(1)},
            ],
            "currentFrameIndex": 0,
            "animationSpeedMs": 120,
            "loops": True,
            "facingDirection": "right",
            "hardware": {"x": 48, "y": 80, "color": 15, "patternIndex": 0},
        },
    }


def build_player_asset() -> dict[str, object]:
    return {
        "id": "smoke_player",
        "name": "Smoke Player",
        "type": "msx2player",
        "data": {
            "id": "smoke_player",
            "name": "Smoke Player",
            "target": "MSX2",
            "render": {
                "spriteAssetId": "smoke_player_sprite",
            },
            "defaultFacing": "right",
            "movement": {
                "mode": "platform",
            },
        },
    }


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
    commands.append({
        "id": "stale_tile_copy_must_be_ignored",
        "op": "copy",
        "atlasEntryId": "brick_red",
        "dx": 0,
        "dy": 0,
        "w": 16,
        "h": 16,
    })
    tile_grid = [[0 for _x in range(16)] for _y in range(12)]
    tile_grid[0][0] = 4  # brick_green: proves tileGrid overrides stale copy commands.
    room_data = {
        "id": "bitmap_room_smoke",
        "name": "Bitmap Room Smoke",
        "target": "MSX2",
        "vdpMode": "SCREEN4_BITMAP_ROOM",
        "width": 256,
        "height": 192,
        "palette": default_palette(),
        "backgroundColor": 1,
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
        "tileGrid": tile_grid,
        "collision": [[0 for _x in range(16)] for _y in range(12)],
        "effects": [[0 for _x in range(16)] for _y in range(12)],
        "behavior": [[0 for _x in range(16)] for _y in range(12)],
        "entities": [],
        "playerEntries": [{"id": "spawn0", "x": 48, "y": 80, "facing": "right", "playerId": "smoke_player"}],
        "runtime": {
            "screenKind": "playable",
            "screenEngine": "player",
            "movementMode": "platform",
            "movementModel": "platform",
            "activeAreaX": 0,
            "activeAreaY": 1,
            "activeAreaWidth": 16,
            "activeAreaHeight": 12,
            "showHud": True,
            "statusHud": True,
            "hudStyle": "statusBars",
            "hudFontAssetId": "smoke_hud_font",
            "initialAir": 180,
            "playerEnergyMax": 16,
            "playerEnergyInitial": 12,
            "hudWidgets": [
                {"id": "hud_stage", "name": "Stage", "kind": "text", "binding": "custom", "x": 8, "y": 4, "width": 56, "height": 8, "primaryColor": 15, "text": "STAGE 1"},
                {"id": "hud_life", "name": "Life", "kind": "bar", "binding": "playerEnergy", "x": 72, "y": 5, "width": 56, "height": 6, "maxValue": 16, "initialValue": 12, "primaryColor": 10, "borderColor": 15, "emptyColor": 4},
                {"id": "hud_item", "name": "Item", "kind": "icon", "binding": "collectibles", "x": 144, "y": 4, "width": 8, "height": 8, "atlasEntryId": "brick_white"},
                {"id": "hud_time", "name": "Time", "kind": "counter", "binding": "air", "variableName": "time", "x": 208, "y": 4, "width": 24, "height": 8, "initialValue": 180, "primaryColor": 11},
            ],
        },
        "notes": "Smoke for SCREEN 4 V9938 bitmap-room export.",
    }
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
            },
            {
                "id": "smoke_hud_font",
                "name": "Smoke HUD Font",
                "type": "msx2hudfont",
                "data": {
                    "target": "MSX2",
                    "vdpMode": "SCREEN4",
                    "baseChar": 192,
                    "characters": " 0123456789AEGILMST",
                    "patterns": SMOKE_HUD_FONT_PATTERNS,
                    "colorByte": 0xF1,
                    "notes": "Smoke font used by SCREEN 5 bitmap-room HUD widgets.",
                },
            },
            build_player_sprite_asset(),
            build_player_asset(),
        ],
    }


def render_smoke_room_data(room: dict[str, object]) -> list[list[int]]:
    width = int(room["width"])
    height = int(room["height"])
    background_color = int(room.get("backgroundColor", 0)) & 0x0F
    pixels = [[background_color for _x in range(width)] for _y in range(height)]
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
    background_color = int(room.get("backgroundColor", 0)) & 0x0F
    pixels = [[background_color for _x in range(width)] for _y in range(height)]
    atlas = room["atlas"]
    atlas_pixels = atlas["pixels"]
    entries = {entry["id"]: entry for entry in atlas["entries"]}
    entry_list = atlas["entries"]
    has_tile_grid = isinstance(room.get("tileGrid"), list)

    for command in room["composition"]["commands"]:
        op = command["op"]
        if has_tile_grid and op == "copy":
            continue
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

    if has_tile_grid:
        for cy, row in enumerate(room["tileGrid"]):
            for cx, value in enumerate(row):
                entry_index = int(value) - 1
                if entry_index < 0 or entry_index >= len(entry_list):
                    continue
                entry = entry_list[entry_index]
                sx = int(entry["sx"])
                sy = int(entry["sy"])
                w = int(entry["w"])
                h = int(entry["h"])
                dx = cx * 16
                dy = cy * 16
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
        "Bitmap room HUD height: 20 px",
        "Bitmap room HUD widgets: 4",
        "Bitmap room game area: 256x192 at visual Y=20",
        "World rooms: 1; start room index: 0",
        "Shared tileset bytes: 2048 at VRAM #A000",
        "FUNCTION: init_plain32k_page2_slot",
        "Mirror the cartridge primary slot from page 1 (#4000-#7FFF) into page 2",
        "add a, 20",
        "player_anim_counter EQU #C004",
        "player_vy           EQU #C006",
        "player_facing       EQU #C008",
        "player_moving       EQU #C00A",
        "FUNCTION: bitmap_update_player_sprite_animation",
        "ld a, (player_moving)",
        "px/frame initial jump velocity (Player Config jumpPower)",
        "bitmap_room_collision_map EQU",
        "bitmap_room_collision_0:",
        "current_screen_index EQU",
    ):
        if marker not in asm_text:
            raise RuntimeError(f"Generated ASM is missing bitmap-room HUD marker: {marker}")

    if "add a, 16\n.store_player_pattern:" not in asm_text:
        raise RuntimeError("Generated ASM is missing mirrored sprite pattern offset for 2 animation frames x 2 hardware layers")
    if "ld (player_pat), a" not in asm_text:
        raise RuntimeError("Generated ASM does not update player_pat from animation/facing state")
    if "add a, 4\n    out (#98), a" not in asm_text:
        raise RuntimeError("Generated ASM does not write SAT pattern offset for the second player hardware layer")

    palette_length = len(extract_db_bytes(asm_text, "screen4_bitmap_palette_data"))
    if palette_length != 32:
        raise RuntimeError(f"screen4_bitmap_palette_data has {palette_length} bytes; expected 32")

    sprite_pattern_length = len(extract_db_bytes(asm_text, "bitmap_room_sprite_patterns"))
    if sprite_pattern_length != 256:
        raise RuntimeError(
            f"bitmap_room_sprite_patterns has {sprite_pattern_length} bytes; expected 256 "
            "(2 frames x 2 layers + mirrored copies, 32 bytes each)"
        )

    sprite_color_length = len(extract_db_bytes(asm_text, "bitmap_room_sprite_colors"))
    if sprite_color_length != 32:
        raise RuntimeError(
            f"bitmap_room_sprite_colors has {sprite_color_length} bytes; expected 32 "
            "(2 hardware layers, 16 line colors each)"
        )

    hud_chunks = re.findall(r"^bitmap_room_hud_seed_rle_chunk_\d+:\s*$", asm_text, flags=re.MULTILINE)
    if not hud_chunks:
        raise RuntimeError("Generated ASM is missing bitmap_room_hud_seed_rle_chunk_* data")
    hud_decoded_length = 0
    for chunk_label in (chunk.split(":", 1)[0] for chunk in hud_chunks):
        chunk_bytes = extract_db_bytes(asm_text, chunk_label)
        if len(chunk_bytes) % 2 != 0:
            raise RuntimeError(f"{chunk_label} has odd RLE byte length: {len(chunk_bytes)}")
        for index in range(0, len(chunk_bytes), 2):
            hud_decoded_length += chunk_bytes[index]
    expected_hud_length = 256 * 20 // 2
    if hud_decoded_length != expected_hud_length:
        raise RuntimeError(
            f"bitmap room HUD seed RLE decodes to {hud_decoded_length} bytes; expected {expected_hud_length}"
        )

    # Shared world tileset (atlas) uploaded once to offscreen VRAM.
    room = next(
        (asset["data"] for asset in project["assets"]  # type: ignore[index]
         if asset.get("type") == "msx2bitmaproom"),
        None,
    )
    atlas = room["atlas"] if room else {"width": 128, "height": 16}
    # Each atlas row is packed to the full 256px VRAM stride (128 bytes), so the
    # tileset occupies 128 bytes * atlas height in offscreen VRAM.
    expected_tileset_length = 128 * int(atlas["height"])
    tileset_chunks = re.findall(r"^bitmap_room_tileset_rle_chunk_\d+:\s*$", asm_text, flags=re.MULTILINE)
    if not tileset_chunks:
        raise RuntimeError("Generated ASM is missing bitmap_room_tileset_rle_chunk_* data")
    tileset_decoded_length = 0
    for chunk_label in (chunk.split(":", 1)[0] for chunk in tileset_chunks):
        chunk_bytes = extract_db_bytes(asm_text, chunk_label)
        if len(chunk_bytes) % 2 != 0:
            raise RuntimeError(f"{chunk_label} has odd RLE byte length: {len(chunk_bytes)}")
        for index in range(0, len(chunk_bytes), 2):
            tileset_decoded_length += chunk_bytes[index]
    if tileset_decoded_length != expected_tileset_length:
        raise RuntimeError(
            f"bitmap room tileset RLE decodes to {tileset_decoded_length} bytes; expected {expected_tileset_length}"
        )

    # Room 0 render program: a list of 15-byte V9938 command blocks. The 192-byte
    # tile map is authoritative, so the only tile copy must be tileGrid[0][0] (the
    # stale composition copy at the same cell must be ignored).
    render_bytes = extract_db_bytes(asm_text, "bitmap_room_render_0")
    if not render_bytes or len(render_bytes) % 15 != 0:
        raise RuntimeError(f"bitmap_room_render_0 has {len(render_bytes)} bytes; expected a non-zero multiple of 15")
    blocks = [render_bytes[i:i + 15] for i in range(0, len(render_bytes), 15)]
    copy_blocks = [b for b in blocks if b[14] == 0x90]  # LMMM (VRAM->VRAM copy)
    if len(copy_blocks) != 1:
        raise RuntimeError(
            f"bitmap_room_render_0 has {len(copy_blocks)} tile-copy blocks; expected exactly 1 (sparse tileGrid)"
        )
    copy = copy_blocks[0]
    dest_x = copy[4] | (copy[5] << 8)
    dest_y = copy[6] | (copy[7] << 8)
    src_y = copy[2] | (copy[3] << 8)
    if dest_x != 0 or dest_y != 20:
        raise RuntimeError(
            f"tile (0,0) copy lands at DX={dest_x},DY={dest_y}; expected DX=0,DY=20 (HUD-offset game band)"
        )
    if src_y < 320:
        raise RuntimeError(
            f"tile copy source Y={src_y} is not in the offscreen tileset (expected >= 320)"
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
        "upload_tileset_atlas",
        "bitmap_room_tileset_data",
        "load_room",
        "replay_room_commands",
        "bitmap_room_render_ptr_table",
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
