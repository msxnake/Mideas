"""Build and install the right-wall stone head and its soap-bubble attack."""

from __future__ import annotations

import copy
import json
import math
import os
import shutil
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
PROJECT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r"C:\Users\salam\Downloads\test623.json")
ROOM_ID = "bitmap_room_bitmapPlatform_mymsxgame_east_east_east_east_east_east_east_east"
STAMP_ID = "msx2bitmapstamp_stone_head_right_20260923"
SPRITE_ID = "msx2sprite_stone_head_soap_bubble_20260923"
SHOOT_ID = "msx2shoot_stone_head_bubble_fan_20260923"
BOSS_ID = "msx2boss_stone_head_right_20260923"
PALETTE_ID = "palette_screen5_stone_head_right_20260923"
DATE = "2026-09-23T00:00:00.000Z"
TRANSPARENT = "rgba(0,0,0,0)"


def nearest_slot(pixel: tuple[int, int, int, int], palette: list[dict]) -> int:
    r, g, b, alpha = pixel
    if alpha < 128:
        return 0
    def distance(slot: dict) -> float:
        value = slot["hex"]
        sr, sg, sb = (int(value[i:i + 2], 16) for i in (1, 3, 5))
        return 0.27 * (r - sr) ** 2 + 0.58 * (g - sg) ** 2 + 0.15 * (b - sb) ** 2
    return min(range(1, 16), key=lambda index: distance(palette[index]))


def make_tile(grid: list[list[int]], frame: str, index: int) -> dict:
    row, col = divmod(index, 4)
    pixels = [grid[y][x] for y in range(row * 16, row * 16 + 16)
              for x in range(col * 16, col * 16 + 16)]
    return {
        "id": f"{STAMP_ID}_{frame}_{index}", "name": f"Cabeza piedra {frame} r{row} c{col}",
        "mode": "SCREEN5_BITMAP", "width": 16, "height": 16,
        "sourceType": "generated", "paletteId": PALETTE_ID,
        "pixelData": pixels, "createdAt": DATE, "updatedAt": DATE,
    }


def build_stamp(palette: list[dict]) -> dict:
    source = Image.open(ROOT / "stone_head_source.png").convert("RGBA")
    if source.width != source.height * 2:
        raise ValueError(f"Expected a two-pose square source sheet, got {source.size}")
    grids = []
    previews = []
    for index, frame in enumerate(("closed", "open")):
        half = source.height
        reduced = source.crop((index * half, 0, (index + 1) * half, half)).resize(
            (64, 64), Image.Resampling.LANCZOS)
        grid = [[nearest_slot(reduced.getpixel((x, y)), palette) for x in range(64)] for y in range(64)]
        grids.append(grid)
        result = Image.new("RGBA", (64, 64))
        pixels = []
        for row in grid:
            for slot in row:
                color = palette[slot]["hex"]
                if slot == 0:
                    pixels.append((0, 0, 0, 0))
                else:
                    pixels.append(tuple(int(color[i:i + 2], 16) for i in (1, 3, 5)) + (255,))
        result.putdata(pixels)
        result.save(ROOT / f"stone_head_{frame}_64.png")
        previews.append(result)
    preview = Image.new("RGBA", (64 * 8 * 2 + 24, 64 * 8 + 16), "#12121a")
    for index, pose in enumerate(previews):
        preview.alpha_composite(pose.resize((512, 512), Image.Resampling.NEAREST), (8 + index * 520, 8))
    preview.save(ROOT / "stone_head_preview.png")
    base = [make_tile(grids[0], "closed", index) for index in range(16)]
    changed = [{"index": index, "tile": make_tile(grids[1], "open", index)}
               for index in range(16)
               if make_tile(grids[1], "open", index)["pixelData"] != base[index]["pixelData"]]
    print(f"Stone head: 64x64, {len(changed)} changed 16x16 cells for the open mouth")
    stamp = {
        "id": STAMP_ID, "name": "Cabeza de piedra - pared derecha",
        "mode": "SCREEN5_BITMAP_STAMP", "columns": 4, "rows": 4,
        "tileWidth": 16, "tileHeight": 16, "sourceType": "generated",
        "paletteId": PALETTE_ID, "tiles": base,
        "frameVariants": [{"id": f"{STAMP_ID}_mouth_open", "name": "Boca abierta", "cells": changed}],
        "tags": ["boss", "stone", "wall", "bubble"],
        "createdAt": DATE, "updatedAt": DATE,
    }
    wrapper = {"id": STAMP_ID, "name": stamp["name"], "savedAt": 1790121600000,
               "stamp": stamp, "palette": copy.deepcopy(palette)}
    (ROOT / "stone_head_64.msx2bitmapstamp.json").write_text(
        json.dumps({"version": 1, "entries": [wrapper]}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"id": STAMP_ID, "name": stamp["name"], "type": "msx2bitmapstamp", "data": wrapper}


def build_bubble(palette: list[dict]) -> dict:
    colors = {slot["slotIndex"]: slot["hex"] for slot in palette}
    frames = []
    for frame in range(2):
        rows = []
        for y in range(16):
            row = []
            for x in range(16):
                distance = math.hypot(x - 7.5, y - 7.5)
                edge = 4.7 if frame else 5.3
                if edge - 1.1 <= distance <= edge + 0.5:
                    slot = 15 if y < 5 else 8 if y < 10 else 3
                    row.append(colors[slot])
                else:
                    row.append(TRANSPARENT)
            rows.append(row)
        frames.append({"id": f"{SPRITE_ID}_frame_{frame}", "data": rows})
    sprite = {
        "id": SPRITE_ID, "name": "Pompa de jabon", "target": "MSX2", "vdpMode": "SCREEN4",
        "size": {"width": 16, "height": 16}, "superSpriteLayout": "single16",
        "superSpriteParts": [{"id": "part_a", "label": "A", "offsetX": 0, "offsetY": 0,
                              "width": 16, "height": 16}],
        "palette": copy.deepcopy(palette), "backgroundColor": TRANSPARENT,
        "frames": frames, "currentFrameIndex": 0, "facingDirection": "left",
        "hardware": {"x": 72, "y": 102, "color": 8, "patternIndex": 0, "useOrColor": True},
        "animationSpeedMs": 160,
    }
    scale = 12
    preview = Image.new("RGBA", (16 * scale * 2 + 16, 16 * scale + 16), "#141420")
    for index, frame in enumerate(frames):
        image = Image.new("RGBA", (16, 16))
        image.putdata([((0, 0, 0, 0) if color == TRANSPARENT else
                        tuple(int(color[i:i + 2], 16) for i in (1, 3, 5)) + (255,))
                       for row in frame["data"] for color in row])
        preview.alpha_composite(image.resize((16 * scale, 16 * scale), Image.Resampling.NEAREST),
                                (8 + index * (16 * scale + 8), 8))
    preview.save(ROOT / "soap_bubble_preview.png")
    return {"id": SPRITE_ID, "name": sprite["name"], "type": "msx2sprite", "data": sprite}


def install() -> None:
    project = json.loads(PROJECT.read_text(encoding="utf-8"))
    assets = project["assets"]
    by_id = {asset["id"]: asset for asset in assets}
    room = by_id[ROOM_ID]["data"]
    if BOSS_ID in by_id or any(e.get("params", {}).get("bossId") == BOSS_ID for e in room["entities"]):
        raise ValueError("Stone head already installed; refusing to duplicate it")
    palette = room["palette"]
    backup = PROJECT.with_name(PROJECT.stem + ".before-stone-head" + PROJECT.suffix)
    if not backup.exists():
        shutil.copy2(PROJECT, backup)
    stamp_asset = build_stamp(palette)
    sprite_asset = build_bubble(palette)
    assets.extend([stamp_asset, sprite_asset])
    assets.append({"id": PALETTE_ID, "name": "Cabeza piedra - paleta pan18 Este", "type": "palette",
                   "data": {"name": "Cabeza piedra - paleta pan18 Este", "mode": "SCREEN5",
                            "slots": copy.deepcopy(palette), "source": "pan18-east-room"}})
    shoot = {
        "id": SHOOT_ID, "name": "Pompas - abanico giratorio", "pattern": "spread",
        "bulletCount": 3, "direction": "left", "angle": 11, "fixedAngle": True,
        "speed": 2, "burstCount": 1, "spreadStep": 1, "burstInterval": 0,
        "spray": 0, "freezeWhileFiring": False,
    }
    assets.append({"id": SHOOT_ID, "name": shoot["name"], "type": "msx2shoot", "data": shoot})
    boss = copy.deepcopy(by_id["msx2boss_area51_rival_monarch_20260923"]["data"])
    boss.update({
        "id": BOSS_ID, "name": "Cabeza de piedra", "bossStampAssetId": STAMP_ID,
        "bossFrames": 2, "bossAnimDelay": 5, "bossHp": 16,
        "bossMovement": "static", "bossPathId": "", "bossSpeed": 0,
        "bossProjectileKind": "sprite", "bossProjectilePattern": "soapBubbles",
        "bossProjectileSpriteId": SPRITE_ID, "bossProjectileTileId": "",
        "bossProjectileSpeed": 2, "bossProjectileDamage": 1,
        "bossShootInterval": 28, "bossBubbleBounces": 5,
        "bossBubbleMouthX": 18, "bossBubbleMouthY": 44,
        "bossLaserTileId": "", "bossLaserShootId": "", "bossLaserDirectionMask": 0,
        "bossHitBlastEnabled": True,
        "bossPhases": [{"id": "phase_1", "enterWhenHpBelowPercent": 100,
                        "interval": 28, "projectileSpeed": 2, "projectileSpriteId": SPRITE_ID,
                        "shootId": SHOOT_ID, "bodyInterval": 3, "moveStepMultiplier": 1}],
        "damageZones": [{"id": "stone_eye", "type": "weak_point", "x": 30, "y": 21,
                         "w": 13, "h": 11, "damageMultiplier": 1,
                         "hitSoundAssetId": "sound_1786978167665"}],
        "roomLockSequence": [{"kind": "closeBarrier", "animated": True, "linesPerFrame": 8}],
        "bossIntroEntryX": 72,
        "notes": "Fixed to the right wall. Frame 0: mouth closed; frame 1 opens only for each volley. Three soap bubbles launch from mouth, reflect diagonally, burst after five arena rebounds, then a new fan rotates its angles."
    })
    assets.append({"id": BOSS_ID, "name": boss["name"], "type": "msx2boss", "data": boss})
    entity = {
        "id": "msx2_entity_pan18_east_stone_head_20260923", "name": boss["name"], "kind": "boss",
        "position": {"x": 12, "y": 3},
        "components": {
            "msx2_transform": {},
            "msx2_movement": {"mode": "static", "direction": -1, "boundsUnit": "px",
                              "minX": 192, "maxX": 192},
            "msx2_collision": {"damage": 1, "hitboxW": 64, "hitboxH": 64,
                               "offsetX": 0, "offsetY": 0},
        },
        "params": {"runtime": "MSX2", "engine": "bitmapBoss", "bossId": BOSS_ID},
    }
    room["entities"].append(entity)
    room["notes"] = str(room.get("notes") or "") + " Right-wall stone head with five-rebound soap bubble volleys."
    temp = PROJECT.with_name(PROJECT.stem + ".stone-writing" + PROJECT.suffix)
    try:
        with temp.open("w", encoding="utf-8", newline="\n") as handle:
            json.dump(project, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temp, PROJECT)
    finally:
        if temp.exists():
            temp.unlink()
    print(f"Installed {boss['name']} in {room['name']}: {PROJECT}")
    print(f"Backup: {backup}")


if __name__ == "__main__":
    install()
