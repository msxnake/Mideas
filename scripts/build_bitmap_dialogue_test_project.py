#!/usr/bin/env python3
"""Build a bitmap-room NPC dialogue test project.

Takes test/newOne25_ice_slide.json (bitmap world, 3 rooms) and injects:
  - an 'msx2dialogue' asset (2 lines, speaker prefixes, 24x24 talking-head
    portrait with mouth closed/open frames),
  - an 'npc' entity in the start room at tile (3,9) (pixels 48,144, standing on
    the floor next to the player spawn) that plays it with the UP key and shows
    atlas entry 0 as its baked visual.

Output: test/msx2-bitmap-dialogue/bitmap_dialogue_test.json
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "test" / "newOne25_ice_slide.json"
OUT_DIR = ROOT / "test" / "msx2-bitmap-dialogue"
OUT_JSON = OUT_DIR / "bitmap_dialogue_test.json"

START_ROOM_ID = "bitmap_room_bitmapPlatform_mymsxgame"


def build_portrait_frames(size: int = 24) -> tuple[list[list[int]], list[list[int]]]:
    """Simple face: skin block, eyes, mouth closed (line) vs open (rectangle)."""

    def base() -> list[list[int]]:
        pixels = [[1 for _x in range(size)] for _y in range(size)]
        for y in range(2, size - 2):
            for x in range(3, size - 3):
                pixels[y][x] = 10  # face
        for ex in (7, size - 10):
            for dy in range(2):
                for dx in range(3):
                    pixels[7 + dy][ex + dx] = 15  # eyes
        return pixels

    closed = base()
    for x in range(8, size - 8):
        closed[size - 8][x] = 6  # closed mouth: thin line

    opened = base()
    for y in range(size - 10, size - 5):
        for x in range(8, size - 8):
            opened[y][x] = 6  # open mouth: block
    return closed, opened


def main() -> int:
    project = json.loads(SOURCE.read_text(encoding="utf-8"))

    closed, opened = build_portrait_frames()
    dialogue_asset = {
        "id": "dlg_test_npc_greeting",
        "name": "NPC Greeting",
        "type": "msx2dialogue",
        "data": {
            "id": "dlg_test_npc_greeting",
            "name": "NPC Greeting",
            "target": "MSX2",
            "lines": [
                {
                    "id": "line_1",
                    "speaker": "GUARDIA",
                    "text": "HOLA VIAJERO. BIENVENIDO AL CASTILLO DE HIELO.",
                    "waitForInput": True,
                },
                {
                    "id": "line_2",
                    "speaker": "GUARDIA",
                    "text": "CUIDADO CON EL SUELO RESBALADIZO DEL ESTE.",
                    "waitForInput": True,
                },
            ],
            "box": {
                "x": 8,
                "y": 8,
                "width": 240,
                "height": 56,
                "backgroundColor": 1,
                "borderColor": 15,
                "textColor": 15,
                "portraitSide": "left",
                "padding": 4,
            },
            "portraits": [
                {
                    "id": "por_guard",
                    "name": "Guard",
                    "width": 24,
                    "height": 24,
                    "closedPixels": closed,
                    "openPixels": opened,
                }
            ],
            "defaultPortraitId": "por_guard",
            "exportOptions": {
                "charDelayFrames": 3,
                "mouthToggleEveryChars": 2,
                "stripUnsupportedChars": True,
            },
        },
    }
    project["assets"].append(dialogue_asset)

    npc_added = False
    for asset in project["assets"]:
        if asset.get("type") != "msx2bitmaproom" or asset.get("id") != START_ROOM_ID:
            continue
        room = asset["data"]
        atlas_entry_id = room["atlas"]["entries"][0]["id"]
        room.setdefault("entities", []).append({
            "id": "npc_test_guard",
            "name": "Guard NPC",
            "kind": "npc",
            "position": {"x": 3, "y": 9},
            "params": {
                "npcDialogue": {
                    "dialogueAssetId": "dlg_test_npc_greeting",
                    "atlasEntryId": atlas_entry_id,
                    "talkKey": "up",
                }
            },
        })
        npc_added = True
    if not npc_added:
        raise SystemExit(f"start room {START_ROOM_ID} not found in {SOURCE}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(project, indent=2) + "\n", encoding="utf-8")
    print(f"Dialogue test project written: {OUT_JSON}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
