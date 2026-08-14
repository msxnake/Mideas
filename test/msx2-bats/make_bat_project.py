"""Add the Murcielago (bat) enemy to the test501 project.

Reads the authored project, appends one 16x16 two-frame sprite asset, one Enemy
Asset bound to it, and two bats in every dark (lighting = 'lamp') room, then
writes a new project under a new name. The source project is never modified.

The sprite is drawn with exactly two tints on purpose. Mideas turns each row of
a sprite into one hardware layer PER DISTINCT COLOUR (SCREEN 5 sprite mode 2
colours a whole LINE, never a pixel), so a row carrying both the grey body and
the green eyes is emitted as two overlapping hardware sprites, each with its own
16-byte line-colour table. That is what lets the dark-room "eyes only" filter
blank the body layer and keep the eyes on the SAME rows -- something a
single-layer bat cannot do.

Usage:
    python test/msx2-bats/make_bat_project.py \
        --src test/msx2-bats/test501_base.json \
        --dst test/msx2-bats/test501_bats.json
"""

from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path

TRANSPARENT = "rgba(0,0,0,0)"
BODY_HEX = "#6D6D6D"   # slot 2 of the caverna palette: mid/dark grey
EYE_HEX = "#B6DB00"    # slot 5: lime green, the only colour that survives the dark
EYE_SLOT = 5           # params.darkEyesColor -> keep only lines painted with this

SPRITE_ID = "msx2sprite_bat_murcielago"
ENEMY_ID = "msx2enemy_bat_murcielago"

# '#' body, 'o' eye, '.' transparent. The eyes sit on rows that ALSO carry body
# pixels (cols 5 and 10) -- that overlap is what forces the second layer.
FRAME_WINGS_UP = [
    "..##........##..",
    ".####......####.",
    ".#####....#####.",
    "..#####..#####..",
    "...###.##.###...",
    ".....######.....",
    ".....#oooo#.....",
    ".....#oooo#.....",
    ".....######.....",
    "......####......",
    ".......##.......",
    "................",
    "................",
    "................",
    "................",
    "................",
]

FRAME_WINGS_DOWN = [
    "................",
    "................",
    "................",
    "....##....##....",
    "....###..###....",
    ".....######.....",
    ".....#oooo#.....",
    ".....#oooo#.....",
    "..#..######..#..",
    ".###..####..###.",
    ".####..##..####.",
    ".#####....#####.",
    "..###......###..",
    "...#........#...",
    "................",
    "................",
]


def grid(rows: list[str]) -> list[list[str]]:
    """ASCII art -> the [row][col] matrix of colour strings Mideas stores."""
    if len(rows) != 16 or any(len(row) != 16 for row in rows):
        raise SystemExit("every frame must be exactly 16x16")
    ink = {"#": BODY_HEX, "o": EYE_HEX, ".": TRANSPARENT}
    return [[ink[char] for char in row] for row in rows]


def is_dark_room(asset: dict) -> bool:
    """Same test as isBitmapLightingRoom() in the generator."""
    return str(((asset.get("data") or {}).get("runtime") or {}).get("lighting", "off")).lower() == "lamp"


def build_sprite(palette: list) -> dict:
    return {
        "id": SPRITE_ID,
        "name": "bat_murcielago",
        "type": "msx2sprite",
        "data": {
            "id": SPRITE_ID,
            "name": "bat_murcielago",
            "target": "MSX2",
            "vdpMode": "SCREEN5",
            "size": {"width": 16, "height": 16},
            "superSpriteLayout": "single16",
            "superSpriteParts": [
                {"id": "part_a", "label": "A", "offsetX": 0, "offsetY": 0, "width": 16, "height": 16}
            ],
            "palette": palette,
            "backgroundColor": TRANSPARENT,
            "currentFrameIndex": 0,
            "animationSpeedMs": 100,
            "loops": True,
            "facingDirection": "right",
            "hitbox": {"width": 12, "height": 10, "offsetX": 2, "offsetY": 3},
            # OR-colour composition would fold two tints into one layer; the bat
            # needs them kept apart, so it stays off.
            "hardware": {"x": 0, "y": 0, "color": EYE_SLOT, "patternIndex": 0, "useOrColor": False},
            "frames": [
                {"id": "bat_wings_up", "data": grid(FRAME_WINGS_UP)},
                {"id": "bat_wings_down", "data": grid(FRAME_WINGS_DOWN)},
            ],
        },
    }


def build_enemy_asset() -> dict:
    return {
        "id": ENEMY_ID,
        "name": "Murcielago",
        "type": "msx2enemy",
        "data": {
            "enemyId": "bat_murcielago",
            "basedOnTemplate": "bat_fly_bounce_8",
            "name": "Murcielago",
            "world": "common",
            "behaviorGroup": "common_entities",
            "category": "simpleEnemy",
            "scope": "common",
            "behavior": {"type": "FlyBounce8"},
            "attack": {"type": "DamageOnTouch"},
            "render": {
                "renderMode": "hardwareSprite",
                "spriteId": SPRITE_ID,
                "palette": "",
                "size": "16x16",
                "animations": {"fly": {"frames": [0, 1], "speed": 6, "loop": True}},
                "roles": [
                    {
                        "id": "fly",
                        "label": "Fly",
                        "state": "FlyBounce8",
                        "behavior": "FlyBounce8",
                        "attack": "DamageOnTouch",
                        "spriteId": "",
                        "animation": "fly",
                        "frames": [0, 1],
                        "speed": 6,
                        "loop": True,
                    }
                ],
                "darkEyesColor": EYE_SLOT,
            },
            "hitboxes": {
                "body": {"x": 2, "y": 3, "w": 12, "h": 10},
                "damage": {"x": 2, "y": 3, "w": 12, "h": 10},
            },
            "stats": {"hp": 1, "damage": 1, "invulnerabilityFrames": 0, "knockback": 0},
            "sound": {
                "onSpawn": None, "onAttack": None, "onHit": None,
                "onDeath": None, "onBounce": None, "onDespawn": None,
            },
            "spawnParamsSchema": [
                {"name": "speed", "label": "Speed (px/2 frames)", "type": "byte",
                 "default": 2, "min": 1, "max": 15, "exportParam": "p0"},
                {"name": "direction", "label": "Initial Direction", "type": "enum",
                 "values": ["left", "right"], "default": "right", "exportParam": "p1"},
                {"name": "turnPx", "label": "Turn Distance (px)", "type": "byte",
                 "default": 100, "min": 1, "max": 255, "exportParam": "p2"},
            ],
            "requiredRoutines": ["Move_FlyBounce8", "DamageOnTouch_Update", "Enemy_Animate"],
            "budget": {
                "cpu": 2, "sprites": 2, "ram": 25,
                "codePackage": "common_entity_code",
                "graphicsPackage": "common_enemy_gfx",
                "graphicsBank": "auto",
                "ramPackage": "",
            },
            "assetId": ENEMY_ID,
        },
    }


def build_bat(room_key: str, index: int, tile_x: int, tile_y: int, direction: int) -> dict:
    pixel_x, pixel_y = tile_x * 16, tile_y * 16
    return {
        "id": f"msx2_enemy_bat_{room_key}_{index}",
        "name": f"Murcielago {index + 1}",
        "kind": "enemy",
        "position": {"x": tile_x, "y": tile_y},
        "spriteAssetId": SPRITE_ID,
        "components": {
            "msx2_transform": {
                "tileX": tile_x, "tileY": tile_y,
                "pixelX": pixel_x, "pixelY": pixel_y,
                "spawnX": pixel_x, "spawnY": pixel_y,
            },
            # Bounds are ignored by the bat engine (the resolver widens them to
            # the whole room), but the editor still draws W1/W2 from them.
            "msx2_movement": {
                "mode": "flyBounce8", "direction": direction, "speed": 2,
                "turnPx": 100, "boundsUnit": "px",
                "minX": 0, "maxX": 240, "minY": 0, "maxY": 176,
            },
            "msx2_hardware_sprite": {
                "msx2SpriteAssetId": SPRITE_ID, "frame": 0, "paletteSlot": EYE_SLOT, "visible": True,
            },
            "msx2_animation": {
                "animation": "fly", "frameStart": 0, "frameCount": 2,
                "frameDelay": 6, "frameList": [0, 1], "loop": True,
            },
            "msx2_collision": {
                "hitboxW": 12, "hitboxH": 10, "offsetX": 2, "offsetY": 3,
                "solid": False, "damage": 1,
            },
        },
        "params": {
            "runtime": "MSX2",
            "engine": "staticEnemy",
            "movement": "flyBounce8",
            "enemyAssetId": ENEMY_ID,
            "enemyRenderRoleId": "fly",
            "enemyRenderState": "FlyBounce8",
            "boundsUnit": "px",
            "minX": 0, "maxX": 240, "minY": 0, "maxY": 176,
            "turnPx": 100,
            "speed": 2,
            "direction": direction,
            "darkEyesColor": EYE_SLOT,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src", required=True)
    parser.add_argument("--dst", required=True)
    parser.add_argument("--project-name", default="test501_bats")
    args = parser.parse_args()

    src, dst = Path(args.src), Path(args.dst)
    print(f"reading {src} ({src.stat().st_size / 1_048_576:.0f} MB)...")
    project = json.loads(src.read_text(encoding="utf-8"))
    assets = project["assets"]

    dark_rooms = [asset for asset in assets if asset.get("type") == "msx2bitmaproom" and is_dark_room(asset)]
    if not dark_rooms:
        raise SystemExit("no dark (lighting='lamp') bitmap room in this project")
    print(f"dark rooms: {[room.get('name') for room in dark_rooms]}")

    # The sprite must resolve its pixels against the SAME palette the dark rooms
    # use, because the exporter maps a pixel to a slot by matching its hex.
    palette = copy.deepcopy(dark_rooms[0]["data"]["palette"])
    for hexcode, label in ((BODY_HEX, "body"), (EYE_HEX, "eye")):
        if not any(slot.get("hex") == hexcode for slot in palette):
            raise SystemExit(f"{label} colour {hexcode} is not in the dark-room palette")

    assets[:] = [asset for asset in assets if asset.get("id") not in {SPRITE_ID, ENEMY_ID}]
    assets.append(build_sprite(palette))
    assets.append(build_enemy_asset())

    # Two bats per dark room: a 2-layer sprite eats 2 of the 4 hardware slots.
    spots = [((3, 2), 1), ((11, 4), -1)]
    for room in dark_rooms:
        room_key = str(room.get("id", "room")).replace("msx2bitmaproom_", "")
        entities = room["data"].setdefault("entities", [])
        entities[:] = [e for e in entities if not str(e.get("id", "")).startswith("msx2_enemy_bat_")]
        for index, ((tile_x, tile_y), direction) in enumerate(spots):
            entities.append(build_bat(room_key, index, tile_x, tile_y, direction))
        print(f"  {room.get('name')}: {len(spots)} bats")

    project["currentProjectName"] = args.project_name
    print(f"writing {dst}...")
    dst.write_text(json.dumps(project), encoding="utf-8")
    print(f"done: {dst.stat().st_size / 1_048_576:.0f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
