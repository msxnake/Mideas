#!/usr/bin/env python3
"""Build the cross-room SHAFT ("pou") fixtures from the vertical-platform smoke.

Three rooms stacked with north/south links (A bottom -> B -> C top). Every room
carries TWO full-height vertical platforms on different columns:

  shaft 0 at x=48  travelling UP    (the ascent ride)
  shaft 1 at x=192 travelling DOWN  (the descent ride)

Two shafts per room is exactly what the shaft id is for: the hand-off must pick
the twin with the SAME id, not the first one it finds.

  (default)  player spawns over shaft 0 in the BOTTOM room and rides up A->B->C
  --down     player spawns over shaft 1 in the TOP room and rides down C->B->A
"""
import argparse
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "test/msx2-platform/smoke_platform_v.json"

UP_SHAFT = {"id": 0, "tile_x": 3, "tile_y": 10, "direction": -1}    # x=48, rises
DOWN_SHAFT = {"id": 1, "tile_x": 12, "tile_y": 1, "direction": 1}   # x=192, descends
SHAFT_MIN_Y = 0
SHAFT_MAX_Y = 191


def shaft_platform(room_key: str, spec: dict) -> dict:
    return {
        "id": f"shaft{spec['id']}_{room_key}",
        "name": f"Shaft {spec['id']} ({room_key})",
        "kind": "platform",
        "position": {"x": spec["tile_x"], "y": spec["tile_y"]},
        "components": {
            "msx2_transform": {},
            "msx2_hardware_sprite": {"msx2SpriteAssetId": ""},
            "msx2_movement": {
                "mode": "patrolY",
                "direction": spec["direction"],
                "boundsUnit": "px",
                "minX": spec["tile_x"] * 16,
                "maxX": spec["tile_x"] * 16,
                "minY": SHAFT_MIN_Y,
                "maxY": SHAFT_MAX_Y,
            },
            "msx2_platform": {"carriesPlayer": True, "oneWay": True, "speed": 1},
        },
        "params": {
            "runtime": "MSX2",
            "engine": "movingPlatform",
            "movement": "patrolY",
            "direction": spec["direction"],
            "shaftId": spec["id"],
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--down", action="store_true", help="descending variant (top room, shaft 1)")
    args = parser.parse_args()
    dst = ROOT / ("test/msx2-platform/smoke_platform_shaft_down.json" if args.down
                  else "test/msx2-platform/smoke_platform_shaft.json")

    project = json.loads(SRC.read_text(encoding="utf-8"))
    project["name"] = "MSX2 Bitmap Shaft Smoke"
    rooms, world = {}, None
    for asset in project["assets"]:
        if asset["type"] == "msx2bitmaproom":
            rooms[asset["id"]] = asset
        elif asset["type"] == "worldmap":
            world = asset

    room_a = rooms["bitmap_room_smoke"]
    room_b = rooms["bitmap_room_smoke_b"]
    room_c = copy.deepcopy(room_b)
    room_c["id"] = "bitmap_room_smoke_c"
    room_c["name"] = "Bitmap Room Smoke C"
    room_c["data"]["id"] = "bitmap_room_smoke_c"
    room_c["data"]["name"] = "Bitmap Room Smoke C"
    project["assets"].append(room_c)

    # Floor-number marks painted last on the right edge: 1 square in the bottom
    # room, 2 in the middle, 3 at the top. A screenshot alone then proves which
    # screen the ride is on (the backdrop register is global, so per-room
    # background colours would not work).
    stack = [("a", room_a), ("b", room_b), ("c", room_c)]
    for floor, (key, room) in enumerate(stack):
        commands = room["data"]["composition"]["commands"]
        for mark in range(floor + 1):
            commands.append({
                "id": f"floor_mark_{key}_{mark}",
                "op": "fill",
                "x": 232, "y": 4 + mark * 20, "w": 16, "h": 16,
                "color": 15,
            })
    for key, room in stack:
        room["data"]["entities"] = [shaft_platform(key, UP_SHAFT), shaft_platform(key, DOWN_SHAFT)]
        entry = copy.deepcopy(room_a["data"]["playerEntries"][0])
        entry["id"] = f"spawn_{key}"
        # Spawn straight onto the shaft that will be ridden.
        entry["x"] = (DOWN_SHAFT if args.down else UP_SHAFT)["tile_x"] * 16
        entry["y"] = 0 if args.down else 80
        room["data"]["playerEntries"] = [entry]

    world["data"]["nodes"] = [
        {"id": "wmnode_bitmap_a", "screenAssetId": "bitmap_room_smoke", "name": "Room A", "position": {"x": 0, "y": 0}},
        {"id": "wmnode_bitmap_b", "screenAssetId": "bitmap_room_smoke_b", "name": "Room B", "position": {"x": 0, "y": -220}},
        {"id": "wmnode_bitmap_c", "screenAssetId": "bitmap_room_smoke_c", "name": "Room C", "position": {"x": 0, "y": -440}},
    ]
    world["data"]["connections"] = [
        {"id": "wmconn_a_b", "fromNodeId": "wmnode_bitmap_a", "toNodeId": "wmnode_bitmap_b",
         "fromDirection": "north", "toDirection": "south"},
        {"id": "wmconn_b_c", "fromNodeId": "wmnode_bitmap_b", "toNodeId": "wmnode_bitmap_c",
         "fromDirection": "north", "toDirection": "south"},
    ]
    world["data"]["startScreenNodeId"] = "wmnode_bitmap_c" if args.down else "wmnode_bitmap_a"

    dst.write_text(json.dumps(project, indent=1), encoding="utf-8")
    print(f"wrote {dst}")


if __name__ == "__main__":
    main()
