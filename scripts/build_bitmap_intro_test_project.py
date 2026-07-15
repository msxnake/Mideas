#!/usr/bin/env python3
"""Build a bitmap-room GameFlow intro test project.

Takes test/newOne31_start_room4.json (bitmap world + 'screen4-bitmap-runtime'
GameFlow) and inserts a synthetic SCREEN 5 presentation scene + Transition
between Start and WorldLink:

    Start -> Screen5Presentation (waitFrames) -> Transition (wipe) -> WorldLink -> End

Output: test/msx2-bitmap-intro/bitmap_intro_test.json
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "test" / "newOne31_start_room4.json"
OUT_DIR = ROOT / "test" / "msx2-bitmap-intro"
OUT_JSON = OUT_DIR / "bitmap_intro_test.json"

WIDTH = 256
HEIGHT = 192
ROW_BYTES = WIDTH // 2


def build_presentation_bitmap() -> list[int]:
    """Recognizable pattern: 16 vertical colour bars + a white frame + diagonal."""
    pixels = [[0 for _x in range(WIDTH)] for _y in range(HEIGHT)]
    for y in range(HEIGHT):
        for x in range(WIDTH):
            pixels[y][x] = (x // 16) & 0x0F
    for x in range(WIDTH):
        pixels[0][x] = 15
        pixels[1][x] = 15
        pixels[HEIGHT - 2][x] = 15
        pixels[HEIGHT - 1][x] = 15
    for y in range(HEIGHT):
        pixels[y][0] = 15
        pixels[y][1] = 15
        pixels[y][WIDTH - 2] = 15
        pixels[y][WIDTH - 1] = 15
    for y in range(HEIGHT):
        x = (y * WIDTH) // HEIGHT
        for dx in range(3):
            if 0 <= x + dx < WIDTH:
                pixels[y][x + dx] = 15
    packed = []
    for y in range(HEIGHT):
        for x in range(0, WIDTH, 2):
            packed.append(((pixels[y][x] & 0x0F) << 4) | (pixels[y][x + 1] & 0x0F))
    assert len(packed) == HEIGHT * ROW_BYTES
    return packed


def default_palette() -> list[dict[str, object]]:
    # MSX2 default-ish palette as masterIndex slots (RGB333 -> index (r<<6)|(g<<3)|b).
    rgb = [
        (0, 0, 0), (0, 0, 0), (1, 6, 1), (3, 7, 3),
        (1, 1, 7), (2, 3, 7), (5, 1, 1), (2, 6, 7),
        (7, 1, 1), (7, 3, 3), (6, 6, 1), (6, 6, 4),
        (1, 4, 1), (6, 2, 5), (5, 5, 5), (7, 7, 7),
    ]
    return [
        {"slotIndex": index, "masterIndex": (r << 6) | (g << 3) | b}
        for index, (r, g, b) in enumerate(rgb)
    ]


def main() -> int:
    project = json.loads(SOURCE.read_text(encoding="utf-8"))

    presentation_asset = {
        "id": "intro_presentation_test",
        "name": "Intro Test Presentation",
        "type": "msx2presentation",
        "data": {
            "enabled": True,
            "name": "Intro Test Presentation",
            "target": "MSX2",
            "screenMode": "SCREEN 5",
            "sourceFileName": None,
            "sourceImageWidth": WIDTH,
            "sourceImageHeight": HEIGHT,
            "width": WIDTH,
            "height": HEIGHT,
            "fitMode": "cover",
            "palette": default_palette(),
            "pixels": [],
            "packedBitmap": build_presentation_bitmap(),
            "compression": {"codec": "ZX0", "enabled": False, "chunkLines": 32},
            "runtime": {
                "showAtBoot": True,
                "clearSpritesBeforeShow": True,
                "waitForKey": False,
                "waitForFrames": 90,
                "vramPage": 0,
                "romDataGroup": "auto",
            },
        },
    }
    project["assets"].append(presentation_asset)

    for asset in project["assets"]:
        if asset.get("type") != "msx2gameflow":
            continue
        data = asset["data"]
        start_id = data["startNodeId"]
        world_connection = next(
            connection for connection in data["connections"]
            if connection["from"]["nodeId"] == start_id
        )
        world_node_id = world_connection["to"]["nodeId"]
        data["nodes"].insert(1, {
            "id": "gf_intro_presentation_node",
            "type": "Screen5Presentation",
            "x": 220,
            "y": 120,
            "presentationAssetId": "intro_presentation_test",
            "waitForKey": False,
            "waitFrames": 90,
        })
        data["nodes"].insert(2, {
            "id": "gf_intro_transition_node",
            "type": "Transition",
            "x": 380,
            "y": 120,
            "effect": "screen5_vertical_pixel_wipe",
            "durationFrames": 30,
        })
        world_connection["to"]["nodeId"] = "gf_intro_presentation_node"
        data["connections"].append({
            "id": "gf_intro_conn_pres_trans",
            "from": {"nodeId": "gf_intro_presentation_node"},
            "to": {"nodeId": "gf_intro_transition_node"},
        })
        data["connections"].append({
            "id": "gf_intro_conn_trans_world",
            "from": {"nodeId": "gf_intro_transition_node"},
            "to": {"nodeId": world_node_id},
        })

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(project, indent=2) + "\n", encoding="utf-8")
    print(f"Intro test project written: {OUT_JSON}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
