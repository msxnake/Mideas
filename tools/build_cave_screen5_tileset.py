from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1] / "assets" / "tilesets" / "cave-world"
SOURCE = ROOT / "cave-world-source.png"
OUT = ROOT / "screen5"
TILE_SIZE = 16
SOURCE_CELL = 156
SOURCE_OFFSET = 3
CANONICAL_TARGET = 32
PALETTE_ID = "palette_screen5_cave_world"

# MSX2 V9938 RGB333 palette. Slot 0 is the SCREEN 5 backdrop/transparent slot.
PALETTE_RGB333 = [
    (0, 0, 0),  # 0 backdrop
    (0, 0, 1),  # 1 deep blue-black
    (1, 1, 2),  # 2 deep recess
    (2, 1, 3),  # 3 violet shadow
    (3, 2, 4),  # 4 purple rock shadow
    (4, 3, 5),  # 5 slate rock
    (5, 4, 5),  # 6 rock mid
    (5, 3, 2),  # 7 brown shadow
    (6, 4, 2),  # 8 earth ochre
    (6, 5, 3),  # 9 lit earth
    (2, 3, 5),  # 10 mineral blue
    (2, 5, 6),  # 11 cyan shadow
    (3, 6, 7),  # 12 crystal cyan
    (3, 5, 2),  # 13 moss
    (6, 3, 1),  # 14 lava orange
    (7, 7, 5),  # 15 highlight
]

SOURCE_ROLES = {
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
}


def rgb888(rgb333: tuple[int, int, int]) -> tuple[int, int, int]:
    return tuple(round(level * 255 / 7) for level in rgb333)


def msx_master_index(rgb333: tuple[int, int, int]) -> int:
    r, g, b = rgb333
    return (r << 6) | (g << 3) | b


def palette_slots() -> list[dict[str, object]]:
    return [
        {
            "slotIndex": i,
            "masterIndex": msx_master_index(rgb),
            "rgb333": list(rgb),
            "hex": "#%02X%02X%02X" % rgb888(rgb),
            "vdpBytes": [(rgb[0] << 4) | rgb[2], rgb[1]],
        }
        for i, rgb in enumerate(PALETTE_RGB333)
    ]


def nearest_slot(rgb: tuple[int, int, int]) -> int:
    best = 0
    best_distance = 10**12
    for i, candidate in enumerate(PALETTE_RGB333):
        distance = sum((rgb[channel] - candidate[channel]) ** 2 for channel in range(3))
        if distance < best_distance:
            best = i
            best_distance = distance
    return best


def fixed_source_tile(source: Image.Image, source_id: int) -> list[int]:
    col = source_id % 8
    row = source_id // 8
    crop = source.crop(
        (
            SOURCE_OFFSET + col * SOURCE_CELL,
            SOURCE_OFFSET + row * SOURCE_CELL,
            SOURCE_OFFSET + (col + 1) * SOURCE_CELL,
            SOURCE_OFFSET + (row + 1) * SOURCE_CELL,
        )
    )
    # Fixed-grid operation only: never trim the content bounding box.
    tile = crop.resize((TILE_SIZE, TILE_SIZE), Image.Resampling.NEAREST).convert("RGBA")
    pixels: list[int] = []
    for r, g, b, alpha in tile.getdata():
        if alpha < 96:
            pixels.append(0)
        else:
            pixels.append(nearest_slot((round(r * 7 / 255), round(g * 7 / 255), round(b * 7 / 255))))
    return pixels


def transform(data: list[int], flip_x: bool, flip_y: bool) -> list[int]:
    result = [0] * 256
    for y in range(16):
        for x in range(16):
            sx = 15 - x if flip_x else x
            sy = 15 - y if flip_y else y
            result[y * 16 + x] = data[sy * 16 + sx]
    return result


def mirror_key(data: list[int]) -> tuple[int, ...]:
    return min(tuple(transform(data, x, y)) for x, y in ((False, False), (True, False), (False, True), (True, True)))


def transform_from_canonical(canonical: list[int], target: list[int]) -> tuple[bool, bool]:
    for flip_x, flip_y in ((False, False), (True, False), (False, True), (True, True)):
        if transform(canonical, flip_x, flip_y) == target:
            return flip_x, flip_y
    return False, False


def palette_image(data: list[int]) -> Image.Image:
    image = Image.new("RGB", (16, 16))
    image.putdata([rgb888(PALETTE_RGB333[pixel]) for pixel in data])
    return image


def solid_role(role: str) -> bool:
    return any(token in role for token in ("fill", "wall", "floor", "platform", "ledge", "corner", "arch", "rock", "slope", "bridge"))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    tiles_dir = OUT / "tiles"
    tiles_dir.mkdir(exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")

    source_pixels = {source_id: fixed_source_tile(source, source_id) for source_id in SOURCE_ROLES}
    canonical: list[dict[str, object]] = []
    by_key: dict[tuple[int, ...], int] = {}
    source_map: dict[int, dict[str, object]] = {}
    required_for_room = [56, 0, 1, 32, 33, 8, 9, 24, 25, 27, 29, 4, 5, 6, 48, 49, 50, 26]
    ordered_source_ids = required_for_room + [source_id for source_id in sorted(source_pixels) if source_id not in required_for_room]
    for source_id in ordered_source_ids:
        key = mirror_key(source_pixels[source_id])
        if key in by_key:
            tile_id = by_key[key]
            fx, fy = transform_from_canonical(canonical[tile_id]["pixels"], source_pixels[source_id])
            source_map[source_id] = {"tileId": tile_id, "flipX": fx, "flipY": fy}
            continue
        if len(canonical) >= CANONICAL_TARGET:
            continue
        tile_id = len(canonical)
        canonical.append({"id": tile_id, "sourceId": source_id, "pixels": list(min(tuple(transform(source_pixels[source_id], x, y)) for x, y in ((False, False), (True, False), (False, True), (True, True))))})
        by_key[key] = tile_id
        fx, fy = transform_from_canonical(canonical[tile_id]["pixels"], source_pixels[source_id])
        source_map[source_id] = {"tileId": tile_id, "flipX": fx, "flipY": fy}

    if len(canonical) != CANONICAL_TARGET:
        raise RuntimeError(f"Expected {CANONICAL_TARGET} canonical tiles, got {len(canonical)}")

    atlas_columns, atlas_rows = 16, 2
    atlas = Image.new("RGB", (atlas_columns * 16, atlas_rows * 16))
    for item in canonical:
        tile_id = int(item["id"])
        tile = palette_image(item["pixels"])
        tile.save(tiles_dir / f"tile_{tile_id:02d}.png")
        atlas.paste(tile, ((tile_id % atlas_columns) * 16, (tile_id // atlas_columns) * 16))
    atlas.save(OUT / "cave-world-screen5-16x16.png")

    preview = atlas.resize((atlas.width * 8, atlas.height * 8), Image.Resampling.NEAREST)
    preview.save(OUT / "cave-world-screen5-16x16-preview.png")

    palette = {
        "id": PALETTE_ID,
        "name": "Cave World MSX2 SCREEN 5",
        "target": "MSX2 V9938 SCREEN 5 / Graphic 4",
        "slots": palette_slots(),
        "notes": "RGB333 authority; slot 0 is the shared backdrop/transparent slot.",
    }
    (OUT / "cave-world-screen5-palette.json").write_text(json.dumps(palette, indent=2) + "\n", encoding="utf-8")

    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    roles = []
    for item in canonical:
        source_id = int(item["sourceId"])
        roles.append({
            "id": int(item["id"]),
            "name": SOURCE_ROLES[source_id],
            "sourceCell": source_id,
            "file": f"tiles/tile_{int(item['id']):02d}.png",
            "mirrorable": True,
        })

    stamp_id = "bitmap_stamp_screen5_cave_world_16x16"
    tiles = []
    for item, role in zip(canonical, roles):
        tile_id = int(item["id"])
        tiles.append({
            "id": f"{stamp_id}_tile_{tile_id:02d}",
            "name": role["name"],
            "mode": "SCREEN5_BITMAP",
            "width": 16,
            "height": 16,
            "sourceType": "generated",
            "sourceFileName": "cave-world-screen5-16x16.png",
            "paletteId": PALETTE_ID,
            "pixelData": item["pixels"],
            "tags": ["cave", "platformer", "screen5", "16x16", "canonical"],
            "createdAt": now,
            "updatedAt": now,
        })
    stamp_asset = {
        "id": stamp_id,
        "name": "Cave World MSX2 SCREEN 5 16x16",
        "type": "msx2bitmapstamp",
        "data": {
            "id": stamp_id,
            "name": "Cave World MSX2 SCREEN 5 16x16",
            "savedAt": int(datetime.now(timezone.utc).timestamp() * 1000),
            "stamp": {
                "id": stamp_id,
                "name": "Cave World MSX2 SCREEN 5 16x16",
                "mode": "SCREEN5_BITMAP_STAMP",
                "columns": 8,
                "rows": 4,
                "tileWidth": 16,
                "tileHeight": 16,
                "sourceType": "generated",
                "sourceFileName": "cave-world-screen5-16x16.png",
                "paletteId": PALETTE_ID,
                "tiles": tiles,
                "tags": ["cave", "platformer", "mirror-ready", "canonical-no-duplicates"],
                "createdAt": now,
                "updatedAt": now,
            },
            "palette": [{k: slot[k] for k in ("slotIndex", "masterIndex", "hex")} for slot in palette["slots"]],
        },
    }
    (OUT / "cave-world-screen5-bitmap-stamp.asset.json").write_text(json.dumps(stamp_asset, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    entry_ids = [f"cave_world_tile_{i:02d}" for i in range(len(canonical))]
    atlas_pixels: list[list[int]] = []
    for row in range(atlas_rows):
        row_pixels = [0] * (atlas_columns * 16)
        for col in range(atlas_columns):
            row_pixels[col * 16 : (col + 1) * 16] = canonical[row * atlas_columns + col]["pixels"][0:16]
        atlas_pixels.append(row_pixels)
    # The atlas is 256x32; append the remaining 15 rows of each tile row.
    atlas_pixels = []
    for pixel_y in range(atlas_rows * 16):
        row_pixels: list[int] = []
        for col in range(atlas_columns):
            row_pixels.extend(canonical[(pixel_y // 16) * atlas_columns + col]["pixels"][((pixel_y % 16) * 16) : ((pixel_y % 16 + 1) * 16)])
        atlas_pixels.append(row_pixels)

    room_cols, room_rows = 16, 13
    def tid(source_id: int) -> int:
        return int(source_map[source_id]["tileId"])

    grid = [[0 for _ in range(room_cols)] for _ in range(room_rows)]
    # A 256x208 playable cave page inside the 256x212 SCREEN 5 display.
    for x in range(room_cols):
        grid[0][x] = tid(56) + 1
        grid[1][x] = tid(0 if x % 3 else 1) + 1
        grid[11][x] = tid(32 if x % 3 else 33) + 1
        grid[12][x] = tid(0) + 1
    for y in range(2, 12):
        grid[y][0] = tid(8) + 1
        grid[y][1] = tid(9) + 1
        grid[y][14] = tid(8) + 1
        grid[y][15] = tid(9) + 1
    for x in range(3, 8):
        grid[8][x] = tid(24 if x % 2 else 25) + 1
    for x in range(9, 14):
        grid[6][x] = tid(27 if x % 2 else 29) + 1
    for x, source_id in ((4, 4), (10, 5), (12, 6)):
        grid[2][x] = tid(source_id) + 1
    for x, source_id in ((5, 48), (8, 49), (11, 50)):
        grid[10][x] = tid(source_id) + 1
    for x, source_id in ((6, 26), (7, 26), (8, 26)):
        grid[4][x] = tid(source_id) + 1

    entries = []
    for item, role in zip(canonical, roles):
        tile_id = int(item["id"])
        source_id = int(item["sourceId"])
        role_name = str(role["name"])
        entries.append({
            "id": entry_ids[tile_id],
            "name": role_name,
            "sx": (tile_id % atlas_columns) * 16,
            "sy": (tile_id // atlas_columns) * 16,
            "w": 16,
            "h": 16,
            "collisionFlags": 1 if solid_role(role_name) else 0,
            "collisionShape": 0 if solid_role(role_name) else 12,
            "sourceStampId": stamp_id,
            "sourceStampTileIndex": tile_id,
        })

    commands = []
    for y, row in enumerate(grid):
        for x, entry_index in enumerate(row):
            if entry_index:
                commands.append({
                    "id": f"cave_copy_{x}_{y}",
                    "op": "copy",
                    "atlasEntryId": entry_ids[entry_index - 1],
                    "dx": x * 16,
                    "dy": y * 16,
                    "w": 16,
                    "h": 16,
                })
    collision = [[1 if cell else 0 for cell in row] for row in grid]
    effects = [[0 for _ in range(room_cols)] for _ in range(room_rows)]
    behavior = [[0 for _ in range(room_cols)] for _ in range(room_rows)]
    room_id = "bitmap_room_screen5_cave_world"
    room_data = {
        "id": room_id,
        "name": "Cave World SCREEN 5 Room",
        "target": "MSX2",
        "vdpMode": "SCREEN5_BITMAP_ROOM",
        "width": 256,
        "height": 212,
        "palette": [{k: slot[k] for k in ("slotIndex", "masterIndex", "hex")} for slot in palette["slots"]],
        "backgroundColor": 0,
        "atlas": {
            "width": atlas_columns * 16,
            "height": atlas_rows * 16,
            "offscreenBaseY": 320,
            "pixels": atlas_pixels,
            "entries": entries,
        },
        "composition": {"source": "authored", "commands": commands},
        "tileGrid": grid,
        "collision": collision,
        "effects": effects,
        "behavior": behavior,
        "entities": [],
        "playerEntries": [{"id": "cave_spawn", "x": 48, "y": 144, "facing": "right", "playerId": "cave_player"}],
        "runtime": {
            "screenKind": "playable",
            "screenEngine": "player",
            "movementMode": "platform",
            "movementModel": "platform",
            "activeAreaX": 0,
            "activeAreaY": 0,
            "activeAreaWidth": 16,
            "activeAreaHeight": 13,
            "showHud": False,
        },
        "notes": "SCREEN 5 cave platform room. Mirror use is described in the companion manifest; Mideas room atlas stores canonical 16x16 entries.",
    }
    room_asset = {"id": room_id, "name": room_data["name"], "type": "msx2bitmaproom", "data": room_data}

    mirror_screen = []
    for y, row in enumerate(grid):
        mirror_row = []
        for x, entry_index in enumerate(row):
            if not entry_index:
                mirror_row.append(None)
                continue
            mirror_row.append({
                "tile": entry_index - 1,
                "flipX": (x + y) % 5 == 0,
                "flipY": (x * 3 + y) % 11 == 0,
            })
        mirror_screen.append(mirror_row)

    mirror_manifest = {
        "name": "cave-world-screen5-mirror-manifest",
        "tileSize": [16, 16],
        "canonicalAtlas": "cave-world-screen5-16x16.png",
        "mirrorModes": ["none", "flipX", "flipY", "flipXY"],
        "sourceCells": source_map,
        "screen": {
            "width": 16,
            "height": 13,
            "cells": mirror_screen,
            "rule": "Each cell references one canonical tile and applies flipX/flipY at draw time.",
        },
        "rules": "Use the canonical tile id plus flipX/flipY at render time; do not store mirrored bitmap copies.",
    }
    (OUT / "cave-world-screen5-mirror-manifest.json").write_text(json.dumps(mirror_manifest, indent=2) + "\n", encoding="utf-8")

    project = {
        "name": "Cave World MSX2 SCREEN 5",
        "currentScreenMode": "SCREEN 5 (Graphics III)",
        "screenMode": "SCREEN 5 (Graphics III)",
        "targetGraphicsBackend": "msx2-screen5-bitmap-room",
        "msx2ProjectProfile": "Platform Bitmap · SCREEN 5 (VK-style)",
        "assets": [stamp_asset, room_asset],
        "mainMenuConfig": {"enabled": False, "title": "Cave World", "items": []},
    }
    (OUT / "cave-world-screen5-mideas-project.json").write_text(json.dumps(project, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # A transform-aware context preview of the 256x212 room, separate from the Mideas room JSON.
    room_preview = Image.new("RGB", (256, 212), rgb888(PALETTE_RGB333[0]))
    for y, row in enumerate(grid):
        for x, entry_index in enumerate(row):
            if not entry_index:
                continue
            tile_id = entry_index - 1
            tile = palette_image(canonical[tile_id]["pixels"])
            # Deliberate mirror usage in the context preview; the room grid remains canonical.
            if (x + y) % 5 == 0:
                tile = tile.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            if (x * 3 + y) % 11 == 0:
                tile = tile.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
            room_preview.paste(tile, (x * 16, y * 16))
    room_preview.resize((512, 424), Image.Resampling.NEAREST).save(OUT / "cave-world-screen5-room-preview.png")


if __name__ == "__main__":
    main()
