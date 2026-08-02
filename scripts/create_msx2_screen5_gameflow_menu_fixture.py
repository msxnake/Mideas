#!/usr/bin/env python3
"""Build the MSX2 SCREEN 5 GameFlow test project.

Generates a Mideas project JSON with:
  * one msx2presentation asset (procedurally drawn 256x192 SCREEN 5 title screen)
  * one msx2gameflow asset exercising SubMenu, Text, TextScroll, TextScrollColor
    and every SCREEN 5 transition effect (vertical / horizontal / mirror /
    diagonal pixel wipe + fade to black)

Usage:
    python scripts/create_msx2_screen5_gameflow_menu_fixture.py \
        --output test/msx2-gameflow/screen5_gameflow_menu_project.json
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

WIDTH = 256
HEIGHT = 192

# 16 SCREEN 5 palette slots as (R, G, B) 0..7 levels.
PALETTE = [
    (0, 0, 0),  # 0  black / transparent
    (0, 0, 2),  # 1  deep space blue
    (1, 0, 3),  # 2  night blue
    (2, 0, 4),  # 3  violet
    (3, 1, 5),  # 4  purple haze
    (4, 2, 6),  # 5  horizon glow
    (6, 3, 6),  # 6  pink
    (7, 5, 2),  # 7  amber
    (7, 7, 7),  # 8  white
    (5, 6, 7),  # 9  ice blue
    (2, 5, 7),  # 10 cyan
    (0, 4, 5),  # 11 teal
    (0, 2, 3),  # 12 deep teal
    (7, 2, 1),  # 13 red
    (3, 3, 4),  # 14 grey blue
    (5, 7, 2),  # 15 lime (used as the GameFlow text colour)
]

FONT_5X7 = {
    "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
    "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
    "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
    "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    " ": ["00000"] * 7,
}


def new_canvas() -> list[list[int]]:
    return [[0 for _ in range(WIDTH)] for _ in range(HEIGHT)]


def draw_text(pixels: list[list[int]], text: str, x0: int, y0: int, color: int, scale: int) -> None:
    cursor = x0
    for character in text.upper():
        glyph = FONT_5X7.get(character, FONT_5X7[" "])
        for row, pattern in enumerate(glyph):
            for column, bit in enumerate(pattern):
                if bit != "1":
                    continue
                for dy in range(scale):
                    for dx in range(scale):
                        x = cursor + column * scale + dx
                        y = y0 + row * scale + dy
                        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
                            pixels[y][x] = color
        cursor += (5 + 1) * scale


def draw_title_screen() -> list[list[int]]:
    pixels = new_canvas()

    # Sky: vertical gradient from deep space down to the horizon glow.
    bands = [(0, 40, 1), (40, 72, 2), (72, 100, 3), (100, 122, 4), (122, 136, 5)]
    for top, bottom, color in bands:
        for y in range(top, bottom):
            for x in range(WIDTH):
                pixels[y][x] = color

    # Starfield: deterministic pseudo-random so the fixture is reproducible.
    seed = 12345
    for _ in range(220):
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        x = seed % WIDTH
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        y = seed % 120
        pixels[y][x] = 8 if (x + y) % 3 else 9

    # Planet with a lit rim on the upper right.
    cx, cy, radius = 196, 52, 34
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            if not (0 <= x < WIDTH and 0 <= y < HEIGHT):
                continue
            distance = math.hypot(x - cx, y - cy)
            if distance > radius:
                continue
            lit = (x - cx) * 0.7 - (y - cy) * 0.7
            if lit > radius * 0.55:
                pixels[y][x] = 9
            elif lit > radius * 0.1:
                pixels[y][x] = 10
            elif lit > -radius * 0.4:
                pixels[y][x] = 11
            else:
                pixels[y][x] = 12

    # Ground: dark silhouette with a jagged ridge line.
    for x in range(WIDTH):
        ridge = 136 + int(10 * math.sin(x / 17.0)) + int(6 * math.sin(x / 5.0))
        for y in range(ridge, HEIGHT):
            pixels[y][x] = 0 if y > ridge + 4 else 14

    # Horizon scanline glow.
    for x in range(WIDTH):
        ridge = 136 + int(10 * math.sin(x / 17.0)) + int(6 * math.sin(x / 5.0))
        if 0 <= ridge < HEIGHT:
            pixels[ridge][x] = 6

    # Title.
    draw_text(pixels, "MIDEAS", 44, 152, 8, 4)
    draw_text(pixels, "MSX2 SCREEN 5", 46, 178, 10, 1)
    return pixels


def pack_bitmap(pixels: list[list[int]]) -> list[int]:
    packed: list[int] = []
    for y in range(HEIGHT):
        row = pixels[y]
        for x in range(0, WIDTH, 2):
            packed.append(((row[x] & 0x0F) << 4) | (row[x + 1] & 0x0F))
    return packed


def palette_assets() -> list[dict]:
    slots = []
    for index, (r, g, b) in enumerate(PALETTE):
        master_index = (r << 6) | (g << 3) | b
        hex_color = "#%02X%02X%02X" % (
            round(r * 255 / 7),
            round(g * 255 / 7),
            round(b * 255 / 7),
        )
        slots.append({"slotIndex": index, "masterIndex": master_index, "hex": hex_color})
    return slots


PRESENTATION_ID = "asset_screen5_gameflow_title"
FLOW_ID = "asset_msx2_gameflow_screen5_menu"


def node(node_id: str, node_type: str, x: int, y: int, **extra) -> dict:
    return {"id": node_id, "type": node_type, "position": {"x": x, "y": y}, **extra}


def connection(from_id: str, to_id: str, source_id: str | None = None) -> dict:
    from_ref: dict = {"nodeId": from_id}
    if source_id:
        from_ref["sourceId"] = source_id
    suffix = f"_{source_id}" if source_id else ""
    return {"id": f"conn_{from_id}{suffix}_to_{to_id}", "from": from_ref, "to": {"nodeId": to_id}}


def build_flow() -> dict:
    presentation_runtime = {"presentationAssetId": PRESENTATION_ID}
    options = [
        {"id": "opt_start", "text": "START GAME"},
        {"id": "opt_story", "text": "STORY"},
        {"id": "opt_credits", "text": "CREDITS"},
        {"id": "opt_exit", "text": "EXIT"},
    ]

    nodes = [
        node("gf_start", "Start", 40, 260),
        node("gf_title", "Screen5Presentation", 220, 260, waitForKey=True, waitFrames=0, **presentation_runtime),
        node(
            "gf_menu",
            "SubMenu",
            420,
            260,
            title="MIDEAS GAME FLOW",
            options=options,
            textColorIndex=8,
            backgroundColorIndex=1,
            highlightColorIndex=1,
            highlightBackgroundIndex=15,
        ),
        # START GAME -> vertical pixel wipe -> coloured text -> fade -> back to menu
        node("gf_wipe_start", "Transition", 660, 60, effect="screen5_vertical_pixel_wipe", durationFrames=20),
        node(
            "gf_text_start",
            "Text",
            860,
            60,
            title="LEVEL 1 BRIEFING",
            message="THE COLONY REACTOR IS OFFLINE.\nREACH THE CORE BEFORE THE\nSHIELD COLLAPSES.\nGOOD LUCK PILOT.",
            textColorIndex=15,
            backgroundColorIndex=0,
            waitForKey=True,
            waitFrames=0,
        ),
        node("gf_fade_start", "Transition", 1060, 60, effect="fade_to_black", durationFrames=10),
        # STORY -> horizontal wipe -> coloured scrolling text
        node("gf_wipe_story", "Transition", 660, 200, effect="screen5_horizontal_pixel_wipe", durationFrames=10),
        node(
            "gf_scroll_story",
            "TextScrollColor",
            860,
            200,
            title="STORY",
            text=(
                "YEAR 2087. THE OUTER COLONIES\n"
                "LOST CONTACT WITH EARTH.\n"
                "\n"
                "A SINGLE SCOUT SHIP WAS SENT\n"
                "THROUGH THE GATE.\n"
                "\n"
                "IT NEVER CAME BACK.\n"
                "\n"
                "YOU ARE THE SECOND ATTEMPT."
            ),
            textColorIndex=10,
            backgroundColorIndex=1,
            scrollStepFrames=16,
            waitForKey=True,
            waitFrames=0,
        ),
        # CREDITS -> mirror wipe -> plain scrolling text
        node("gf_wipe_credits", "Transition", 660, 340, effect="screen5_mirror_pixel_wipe", durationFrames=10),
        node(
            "gf_scroll_credits",
            "TextScroll",
            860,
            340,
            title="CREDITS",
            text=(
                "MIDEAS MSX GAME EDITOR\n"
                "\n"
                "GAME FLOW ENGINE\n"
                "SCREEN 5 BITMAP BACKEND\n"
                "\n"
                "VDP COMMAND ENGINE TEXT\n"
                "\n"
                "THANKS FOR PLAYING"
            ),
            textColorIndex=7,
            backgroundColorIndex=2,
            scrollStepFrames=16,
            waitForKey=True,
            waitFrames=0,
        ),
        # Shared return path: reload the title so the menu gets its background back.
        node("gf_title_back", "Screen5Presentation", 1260, 200, waitForKey=False, waitFrames=0, **presentation_runtime),
        # EXIT -> diagonal wipe -> End screen
        node("gf_wipe_exit", "Transition", 660, 470, effect="screen5_diagonal_pixel_wipe", durationFrames=10),
        node("gf_end", "End", 860, 470, title="End", message="THANKS FOR PLAYING", waitForKey=False, waitFrames=0),
    ]

    connections = [
        connection("gf_start", "gf_title"),
        connection("gf_title", "gf_menu"),
        connection("gf_menu", "gf_wipe_start", "opt_start"),
        connection("gf_menu", "gf_wipe_story", "opt_story"),
        connection("gf_menu", "gf_wipe_credits", "opt_credits"),
        connection("gf_menu", "gf_wipe_exit", "opt_exit"),
        connection("gf_wipe_start", "gf_text_start"),
        connection("gf_text_start", "gf_fade_start"),
        connection("gf_fade_start", "gf_title_back"),
        connection("gf_wipe_story", "gf_scroll_story"),
        connection("gf_scroll_story", "gf_title_back"),
        connection("gf_wipe_credits", "gf_scroll_credits"),
        connection("gf_scroll_credits", "gf_title_back"),
        connection("gf_title_back", "gf_menu"),
        connection("gf_wipe_exit", "gf_end"),
    ]

    return {
        "id": FLOW_ID,
        "name": "Main MSX2",
        "target": "MSX2",
        "purpose": "screen5-presentation",
        "nodes": nodes,
        "connections": connections,
        "startNodeId": "gf_start",
        "panOffset": {"x": 0, "y": 0},
        "zoomLevel": 1,
    }


def build_project() -> dict:
    pixels = draw_title_screen()
    packed = pack_bitmap(pixels)
    presentation = {
        "enabled": True,
        "name": "SCREEN 5 GameFlow Title",
        "target": "MSX2",
        "screenMode": "SCREEN 5",
        "sourceFileName": "generated_by_create_msx2_screen5_gameflow_menu_fixture.py",
        "sourceImageWidth": WIDTH,
        "sourceImageHeight": HEIGHT,
        "width": WIDTH,
        "height": HEIGHT,
        "fitMode": "cover",
        "paletteMode": "manual",
        "backgroundSlot": 0,
        "backgroundHex": "#000000",
        "palette": palette_assets(),
        "packedBitmap": packed,
        "compression": {"codec": "ZX0", "enabled": True, "chunkLines": 32},
        "runtime": {
            "showAtBoot": True,
            "clearSpritesBeforeShow": True,
            "waitForKey": True,
            "waitForFrames": 0,
            "vramPage": 0,
            "romDataGroup": "auto",
        },
        "visibleImageBytes": len(packed),
        "vramBitmapBytes": 212 * 128,
    }

    return {
        "name": "MSX2 SCREEN 5 GameFlow Menu",
        "screenMode": "SCREEN 5 (Graphics III)",
        "currentScreenMode": "SCREEN 5 (Graphics III)",
        "targetGraphicsBackend": "msx2-screen5-presentation",
        "assets": [
            {
                "id": PRESENTATION_ID,
                "name": "SCREEN 5 GameFlow Title",
                "type": "msx2presentation",
                "data": presentation,
            },
            {
                "id": FLOW_ID,
                "name": "Main MSX2",
                "type": "msx2gameflow",
                "data": build_flow(),
            },
        ],
        "selectedAssetId": FLOW_ID,
        "currentEditor": "Msx2GameFlow",
        "createdAt": 1785000000000,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(build_project(), indent=1), encoding="utf-8")
    print(f"Wrote {output} ({output.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
