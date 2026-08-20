from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1] / "assets" / "tilesets" / "cave-world"
DEDUPE = ROOT / "dedupe-156"
OUT = ROOT / "final"
TILE_SIZE = 32
ATLAS_COLUMNS = 8
TILE_COUNT = 64


ROLES = {
    0: "rock_fill",
    1: "earth_fill",
    2: "cracked_lava_rock",
    3: "ceiling_edge",
    4: "stalactite_long",
    5: "ceiling_drip",
    6: "ceiling_drip_wide",
    7: "ceiling_corner",
    8: "wall_left",
    9: "wall_left_earth",
    10: "wall_left_lava",
    11: "inner_corner_left",
    12: "wall_right",
    13: "wall_right_earth",
    14: "wall_right_open",
    15: "inner_corner_right",
    16: "wall_edge_left",
    17: "wall_edge_left_earth",
    18: "wall_edge_lava",
    19: "wall_edge_right",
    20: "cave_opening_small",
    21: "cave_opening_large",
    22: "wall_right_lava",
    23: "wall_right_cap",
    24: "platform_stone",
    25: "platform_stone_short",
    26: "bridge_wood",
    27: "platform_moss",
    28: "platform_crystal",
    29: "platform_thin",
    30: "ledge_left",
    31: "ledge_right",
    32: "floor_top_rock",
    33: "floor_top_earth",
    34: "floor_top_moss",
    35: "floor_top_crystal",
    36: "floor_lava_rock",
    37: "slope_up",
    38: "slope_down",
    39: "floor_corner",
    40: "cave_arch_left",
    41: "cave_arch_inner",
    42: "cave_arch_slope",
    43: "stalagmite_small",
    44: "stalagmite_tall",
    45: "rock_boulder",
    46: "rock_crystal_boulder",
    47: "moss_boulder",
    48: "crystal_cluster_large",
    49: "crystal_cluster_small",
    50: "crystal_cluster_wide",
    51: "rock_pebble",
    52: "moss_rock",
    53: "lava_boulder",
    54: "stalagmite_crystal",
    55: "crystal_stalagmite",
    56: "ceiling_rock_band",
    57: "ceiling_earth_band",
    58: "ceiling_opening",
    59: "ceiling_stalactite_band",
    60: "ceiling_stalactite_single",
    61: "empty",
    62: "empty_variant_a",
    63: "empty_variant_b",
}


def transformed(tile: Image.Image, flip_x: bool, flip_y: bool) -> Image.Image:
    if flip_x:
        tile = tile.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if flip_y:
        tile = tile.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    return tile


def build_screen() -> list[list[dict | None]]:
    w, h = 32, 18
    screen: list[list[dict | None]] = [[None for _ in range(w)] for _ in range(h)]

    def put(x: int, y: int, tile: int, flip_x: bool = False, flip_y: bool = False) -> None:
        if 0 <= x < w and 0 <= y < h:
            screen[y][x] = {"tile": tile, "flipX": flip_x, "flipY": flip_y}

    # Ceiling and opposite wall reuse the same canonical pieces through mirroring.
    for x in range(w):
        put(x, 0, 56 if x % 3 else 57, flip_x=(x % 2 == 1))
        put(x, 1, 0 if x % 4 else 1, flip_x=(x % 2 == 1))
        put(x, 17, 32 if x % 4 else 33, flip_x=(x % 2 == 1), flip_y=True)
    for y in range(2, 17):
        put(0, y, 8, flip_y=(y % 2 == 1))
        put(1, y, 9, flip_y=(y % 2 == 0))
        put(30, y, 8, flip_x=True, flip_y=(y % 2 == 1))
        put(31, y, 9, flip_x=True, flip_y=(y % 2 == 0))

    # Platforms, ledges, openings and decorative cave props.
    for x in range(4, 12):
        put(x, 11, 24 if x % 3 else 25, flip_x=(x % 2 == 1))
    for x in range(20, 28):
        put(x, 8, 27 if x % 2 else 29, flip_x=(x % 3 == 0))
    for x, tile in [(5, 4), (10, 5), (22, 4), (26, 6)]:
        put(x, 2, tile, flip_x=(x % 2 == 0))
    for x, tile in [(7, 16), (15, 21), (24, 17)]:
        put(x, 16, tile, flip_x=(x % 2 == 0), flip_y=True)
    for x, tile in [(8, 10), (17, 18), (25, 2)]:
        put(x, 14, tile, flip_x=(x % 2 == 1))
    for x, tile in [(6, 10), (13, 48), (18, 49), (23, 50), (27, 54)]:
        put(x, 15, tile, flip_x=(x % 2 == 0))
    for x, tile in [(12, 26), (13, 26), (14, 26)]:
        put(x, 5, tile, flip_x=(x == 13))
    return screen


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    tiles_dir = OUT / "tiles"
    tiles_dir.mkdir(exist_ok=True)

    atlas = Image.new("RGBA", (ATLAS_COLUMNS * TILE_SIZE, ((TILE_COUNT + ATLAS_COLUMNS - 1) // ATLAS_COLUMNS) * TILE_SIZE), (0, 0, 0, 0))
    for tile_id in range(TILE_COUNT):
        source = Image.open(DEDUPE / "tiles" / f"tile_{tile_id:04d}.png").convert("RGBA")
        tile = source.resize((TILE_SIZE, TILE_SIZE), Image.Resampling.LANCZOS)
        if tile_id >= 61:
            tile = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
        tile.save(tiles_dir / f"tile_{tile_id:04d}.png")
        atlas.paste(tile, ((tile_id % ATLAS_COLUMNS) * TILE_SIZE, (tile_id // ATLAS_COLUMNS) * TILE_SIZE), tile)
    atlas.save(OUT / "cave-world-tileset-32.png")

    tileset = {
        "name": "cave-world",
        "description": "Canonical cave tiles for a side-scrolling platformer.",
        "tileSize": [TILE_SIZE, TILE_SIZE],
        "atlas": "cave-world-tileset-32.png",
        "columns": ATLAS_COLUMNS,
        "rows": 8,
        "tileCount": TILE_COUNT,
        "dedupe": {
            "sourceGrid": [8, 8],
            "sourceTileSize": 156,
            "similarityThreshold": 0,
            "uniqueTiles": TILE_COUNT,
            "duplicateTilesRemoved": 0,
            "mirrorCopiesStored": 0,
        },
        "mirrorModes": ["none", "flipX", "flipY", "flipXY"],
        "tiles": [
            {
                "id": tile_id,
                "role": ROLES.get(tile_id, "cave_detail"),
                "file": f"tiles/tile_{tile_id:04d}.png",
                "mirrorable": True,
            }
            for tile_id in range(TILE_COUNT)
        ],
    }
    (OUT / "cave-world-tileset.json").write_text(json.dumps(tileset, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    screen = build_screen()
    screen_data = {
        "name": "cave-world-screen-mirror-demo",
        "tileSize": [TILE_SIZE, TILE_SIZE],
        "size": [32, 18],
        "atlas": "cave-world-tileset-32.png",
        "emptyCell": None,
        "transformFields": {"flipX": "mirror horizontally", "flipY": "mirror vertically"},
        "rows": screen,
    }
    (OUT / "screen-mirror-demo.json").write_text(json.dumps(screen_data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    preview = Image.new("RGBA", (32 * TILE_SIZE, 18 * TILE_SIZE), (10, 14, 27, 255))
    for y, row in enumerate(screen):
        for x, cell in enumerate(row):
            if not cell:
                continue
            tile = Image.open(tiles_dir / f"tile_{cell['tile']:04d}.png").convert("RGBA")
            tile = transformed(tile, cell["flipX"], cell["flipY"])
            preview.alpha_composite(tile, (x * TILE_SIZE, y * TILE_SIZE))
    preview.save(OUT / "screen-mirror-demo.png")


if __name__ == "__main__":
    main()
