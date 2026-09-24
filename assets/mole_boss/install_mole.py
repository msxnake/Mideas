"""Downsample El Topo's high-resolution art and install the 32x32 boss in pan17."""

from __future__ import annotations

import copy
import json
import os
import shutil
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
PROJECT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r"C:\Users\salam\Downloads\test623.json")
ROOM_ID = "bitmap_room_bitmapPlatform_mymsxgame_east_east_east_east_east_east"
STAMP_ID = "msx2bitmapstamp_el_topo_32_20260924"
PALETTE_ID = "palette_screen5_el_topo_20260924"
BOSS_ID = "msx2boss_el_topo_area51_20260924"
ENTITY_ID = "msx2_entity_pan17_el_topo_20260924"
DATE = "2026-09-24T00:00:00.000Z"
TRANSPARENT = "rgba(0,0,0,0)"


def background(pixel: tuple[int, int, int]) -> bool:
    r, g, b = pixel[:3]
    return r > 170 and b > 170 and g < 125 and r + b > 3 * g


def nearest_slot(pixel: tuple[int, int, int, int], palette: list[dict]) -> int:
    r, g, b, a = pixel
    if a < 128:
        return 0
    def distance(index: int) -> float:
        value = palette[index]["hex"]
        sr, sg, sb = (int(value[i:i + 2], 16) for i in (1, 3, 5))
        return 0.27 * (r - sr) ** 2 + 0.58 * (g - sg) ** 2 + 0.15 * (b - sb) ** 2
    return min(range(1, 16), key=distance)


def prepare_frame(source: Image.Image, index: int, palette: list[dict]) -> tuple[list[list[int]], Image.Image]:
    cell_width = source.width // 3
    cell = source.crop((index * cell_width, 0, (index + 1) * cell_width, source.height)).convert("RGBA")
    pixels = []
    for r, g, b, _ in cell.getdata():
        pixels.append((0, 0, 0, 0) if background((r, g, b)) else (r, g, b, 255))
    cell.putdata(pixels)
    bounds = cell.getbbox()
    if bounds is None:
        raise ValueError(f"Frame {index} has no art after chroma key")
    art = cell.crop(bounds)
    max_height = (19, 27, 30)[index]
    scale = min(30 / art.width, max_height / art.height)
    art = art.resize((max(1, round(art.width * scale)), max(1, round(art.height * scale))), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (32, 32))
    canvas.alpha_composite(art, ((32 - art.width) // 2, 31 - art.height))
    grid = [[nearest_slot(canvas.getpixel((x, y)), palette) for x in range(32)] for y in range(32)]
    snapped = Image.new("RGBA", (32, 32))
    snapped.putdata([
        (0, 0, 0, 0) if slot == 0 else
        tuple(int(palette[slot]["hex"][i:i + 2], 16) for i in (1, 3, 5)) + (255,)
        for row in grid for slot in row
    ])
    snapped.save(ROOT / f"el_topo_frame_{index}.png")
    return grid, snapped


def tile(grid: list[list[int]], frame: int, index: int) -> dict:
    row, col = divmod(index, 2)
    return {
        "id": f"{STAMP_ID}_f{frame}_{index}", "name": f"El Topo frame {frame} r{row} c{col}",
        "mode": "SCREEN5_BITMAP", "width": 16, "height": 16,
        "sourceType": "generated", "paletteId": PALETTE_ID,
        "pixelData": [grid[y][x] for y in range(row * 16, row * 16 + 16)
                      for x in range(col * 16, col * 16 + 16)],
        "createdAt": DATE, "updatedAt": DATE,
    }


def build_stamp(palette: list[dict]) -> dict:
    source = Image.open(ROOT / "mole_source_highres.png")
    grids, frames = zip(*(prepare_frame(source, index, palette) for index in range(3)))
    preview = Image.new("RGBA", (32 * 10 * 3 + 40, 32 * 10 + 16), "#16161D")
    for index, frame in enumerate(frames):
        preview.alpha_composite(frame.resize((320, 320), Image.Resampling.NEAREST), (8 + index * 328, 8))
    preview.save(ROOT / "el_topo_preview.png")
    base = [tile(grids[0], 0, index) for index in range(4)]
    variants = []
    for frame in (1, 2):
        variants.append({
            "id": f"{STAMP_ID}_frame_{frame}",
            "name": "En superficie" if frame == 1 else "Descarga electrica",
            "cells": [{"index": index, "tile": tile(grids[frame], frame, index)}
                      for index in range(4) if tile(grids[frame], frame, index)["pixelData"] != base[index]["pixelData"]],
        })
    stamp = {
        "id": STAMP_ID, "name": "El Topo - 32x32",
        "mode": "SCREEN5_BITMAP_STAMP", "columns": 2, "rows": 2,
        "tileWidth": 16, "tileHeight": 16, "sourceType": "generated",
        "paletteId": PALETTE_ID, "tiles": base, "frameVariants": variants,
        "tags": ["boss", "mole", "area51", "electric"],
        "createdAt": DATE, "updatedAt": DATE,
    }
    wrapper = {"id": STAMP_ID, "name": stamp["name"], "savedAt": 1790208000000,
               "stamp": stamp, "palette": copy.deepcopy(palette)}
    (ROOT / "el_topo_32.msx2bitmapstamp.json").write_text(
        json.dumps({"version": 1, "entries": [wrapper]}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"id": STAMP_ID, "name": stamp["name"], "type": "msx2bitmapstamp", "data": wrapper}


def install() -> None:
    project = json.loads(PROJECT.read_text(encoding="utf-8"))
    assets = project["assets"]
    by_id = {asset["id"]: asset for asset in assets}
    if BOSS_ID in by_id:
        raise ValueError("El Topo is already installed")
    room = by_id[ROOM_ID]["data"]
    palette = room["palette"]
    backup = PROJECT.with_name(PROJECT.stem + ".before-el-topo" + PROJECT.suffix)
    if not backup.exists():
        shutil.copy2(PROJECT, backup)
    stamp = build_stamp(palette)
    bolt = json.loads((ROOT / "electric_bolt.msx2sprite.json").read_text(encoding="utf-8"))["entries"][0]
    sprite = bolt["sprite"]
    sprite_id = sprite["id"]
    assets.extend([
        stamp,
        {"id": PALETTE_ID, "name": "El Topo - paleta pan17", "type": "palette",
         "data": {"name": "El Topo - paleta pan17", "mode": "SCREEN5", "slots": copy.deepcopy(palette), "source": "pan17"}},
        {"id": sprite_id, "name": sprite["name"], "type": "msx2sprite", "data": sprite},
    ])
    boss = copy.deepcopy(by_id["msx2boss_stone_head_right_20260923"]["data"])
    boss.update({
        "id": BOSS_ID, "name": "El Topo", "bossStampAssetId": STAMP_ID,
        "bossFrames": 3, "bossAnimDelay": 12, "bossHp": 12, "bossDamage": 1, "bossInterval": 3,
        "bossMovement": "burrowRandom", "bossPathId": "", "bossSpeed": 0,
        "bossThreadEnabled": False, "bossThreadLength": 0,
        "bossMoleMinX": 16, "bossMoleMaxX": 80,
        "bossMoleGroundOffsetPx": 0, "bossMoleHoleColor": 1,
        "bossMoleHiddenFrames": 48, "bossMoleEmergeFrames": 15, "bossMoleRetreatFrames": 12,
        "bossMoleRayRangePx": 128, "bossMoleRayAngleSteps": 2, "bossMoleRaySpeed": 2,
        "bossProjectileKind": "sprite", "bossProjectilePattern": "moleLightning",
        "bossProjectileSpriteId": sprite_id, "bossProjectileTileId": "",
        "bossProjectileSpeed": 2, "bossProjectileDamage": 1, "bossShootInterval": 90,
        "bossLaserTileId": "", "bossLaserShootId": "", "bossLaserDirectionMask": 0,
        "bossPhases": [{"id": "phase_1", "enterWhenHpBelowPercent": 100,
                        "interval": 90, "projectileSpeed": 2, "projectileSpriteId": sprite_id,
                        "shootId": "", "bodyInterval": 3, "moveStepMultiplier": 1}],
        "damageZones": [{"id": "mole_helmet", "type": "armor", "x": 7, "y": 6, "w": 18, "h": 8,
                         "damageMultiplier": 0},
                        {"id": "mole_face", "type": "weak_point", "x": 11, "y": 13, "w": 12, "h": 10,
                         "damageMultiplier": 1}],
        "roomLockSequence": [], "bossIntroEntryX": 198,
        "notes": "32x32 cyber mole. Opens two floor tiles, emerges, fires three upward electric bolts (vertical and diagonals), retreats, restores the ground, then resurfaces at another random X.",
    })
    assets.append({"id": BOSS_ID, "name": boss["name"], "type": "msx2boss", "data": boss})
    room["entities"].append({
        "id": ENTITY_ID, "name": "El Topo", "kind": "boss", "position": {"x": 3, "y": 9},
        "components": {
            "msx2_transform": {},
            "msx2_movement": {"mode": "static", "direction": 1, "boundsUnit": "px", "minX": 16, "maxX": 80},
            "msx2_collision": {"damage": 1, "hitboxW": 32, "hitboxH": 32, "offsetX": 0, "offsetY": 0},
        },
        "params": {"runtime": "MSX2", "engine": "bitmapBoss", "bossId": BOSS_ID},
    })
    room["notes"] = str(room.get("notes") or "") + " El Topo opens and restores the floor between electric volleys."
    temporary = PROJECT.with_name(PROJECT.stem + ".mole-writing" + PROJECT.suffix)
    try:
        with temporary.open("w", encoding="utf-8", newline="\n") as handle:
            json.dump(project, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temporary, PROJECT)
    finally:
        temporary.unlink(missing_ok=True)
    print(f"Installed El Topo in {PROJECT}; backup {backup}")


if __name__ == "__main__":
    install()
