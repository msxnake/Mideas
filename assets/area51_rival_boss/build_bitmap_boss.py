"""Contract the original high-resolution closed/open arm poses to SCREEN 5.

The left and right halves of alien_rival_source_clean.png were generated at
887x887 each. Keeping the same canvas for both poses prevents the 48x48 boss
from jumping when its arms alternate.
"""

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
SOURCE_SHEET = ROOT / "alien_rival_source_clean.png"
SOURCES = {"idle": (0, 0, 887, 887), "charge": (887, 0, 1774, 887)}
PALETTE_HEX = [
    "rgba(0,0,0,0)", "#000000", "#002449", "#00496D", "#246D92",
    "#496D92", "#242424", "#494949", "#6D6D6D", "#929292",
    "#FF2400", "#DBDB6D", "#FF6D49", "#B6DB00", "#2492DB", "#FFFFFF",
]
MASTER_INDEX = [-1, 0, 10, 19, 92, 156, 73, 146, 219, 292, 456, 435, 474, 368, 102, 511]
PALETTE = [
    {"slotIndex": i, "masterIndex": MASTER_INDEX[i], "hex": color}
    for i, color in enumerate(PALETTE_HEX)
]
RGBA = {0: (0, 0, 0, 0)} | {
    i: tuple(bytes.fromhex(color[1:])) + (255,)
    for i, color in enumerate(PALETTE_HEX) if i > 0
}
STAMP_ID = "msx2bitmapstamp_alien_rival_48"
PALETTE_ID = "palette_screen5_area51_defense_omega_20260818"
STAMP_DATE = "2026-09-23T00:00:00.000Z"


def quantize(pixel):
    red, green, blue, alpha = pixel
    luminance = (red * 3 + green * 4 + blue) / 8
    if alpha < 150 or (green > red * 1.45 and green > blue * 1.15):
        return 0
    # The generated source has a few magenta edge specks outside the figure.
    if red > green * 1.32 and blue > red * 0.9:
        return 0
    if blue > red * 1.22 and blue > green * 1.08 and blue > 75:
        return 15 if red > 150 and green > 150 else 14
    if red > green * 1.35 and red > blue * 1.27 and red > 105:
        return 12 if red > 190 else 10
    if luminance < 18:
        return 1
    if luminance < 35:
        return 6
    if luminance < 60:
        return 7
    if luminance < 95:
        return 8
    if luminance < 170:
        return 9
    return 15


def make_tile(grid, index, frame):
    row, col = divmod(index, 3)
    pixels = [
        grid[y][x]
        for y in range(row * 16, row * 16 + 16)
        for x in range(col * 16, col * 16 + 16)
    ]
    return {
        "id": f"{STAMP_ID}_{frame}_{index}",
        "name": f"Alien rival {frame} r{row} c{col}",
        "mode": "SCREEN5_BITMAP", "width": 16, "height": 16,
        "sourceType": "generated", "paletteId": PALETTE_ID,
        "pixelData": pixels,
        "createdAt": STAMP_DATE, "updatedAt": STAMP_DATE,
    }


grids = []
master_sheet = Image.open(SOURCE_SHEET).convert("RGBA")
if master_sheet.size != (1774, 887):
    raise ValueError(f"Unexpected master sheet size: {master_sheet.size}")
for frame_name, crop in SOURCES.items():
    canvas = master_sheet.crop(crop).resize((48, 48), Image.Resampling.LANCZOS)
    grid = [[quantize(canvas.getpixel((x, y))) for x in range(48)] for y in range(48)]
    grids.append(grid)
    bitmap = Image.new("RGBA", (48, 48))
    bitmap.putdata([RGBA[slot] for row in grid for slot in row])
    bitmap.save(ROOT / f"alien_rival_{frame_name}_48x48.png")

base_tiles = [make_tile(grids[0], index, "idle") for index in range(9)]
charge_tiles = [make_tile(grids[1], index, "charge") for index in range(9)]
changed = [
    {"index": index, "tile": charge_tiles[index]}
    for index in range(9)
    if charge_tiles[index]["pixelData"] != base_tiles[index]["pixelData"]
]
stamp = {
    "id": STAMP_ID, "name": "Sujeto Rival - Monarca de otro mundo",
    "mode": "SCREEN5_BITMAP_STAMP", "columns": 3, "rows": 3,
    "tileWidth": 16, "tileHeight": 16, "sourceType": "generated",
    "paletteId": PALETTE_ID, "tiles": base_tiles,
    "frameVariants": [{"id": f"{STAMP_ID}_charge", "name": "Brazos abiertos", "cells": changed}],
    "tags": ["boss", "alien", "area51"],
    "createdAt": STAMP_DATE, "updatedAt": STAMP_DATE,
}
library = {
    "version": 1,
    "entries": [{
        "id": STAMP_ID, "name": stamp["name"], "savedAt": 1790121600000,
        "stamp": stamp, "palette": PALETTE,
    }],
}
(ROOT / "alien_rival_48.msx2bitmapstamp.json").write_text(
    json.dumps(library, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)

preview = Image.new("RGBA", (48 * 8 * 2 + 24, 48 * 8 + 16), "#141420")
for index, name in enumerate(("idle", "charge")):
    bitmap = Image.open(ROOT / f"alien_rival_{name}_48x48.png").convert("RGBA")
    preview.alpha_composite(bitmap.resize((384, 384), Image.Resampling.NEAREST), (8 + index * 392, 8))
preview.save(ROOT / "alien_rival_48_preview.png")
print(f"Built closed/open arm poses at 48x48 and a 3x3 Boss Stamp ({len(changed)} changed cells).")
