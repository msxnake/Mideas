"""Build Codex's two-frame Area51 SCREEN 5 explosion contest entry.

The pixels are deliberately authored on the 16x16 grid.  The generated
reference is kept beside the final asset, but it is not sampled or resized
into the production data: every pixel below is an intentional palette slot.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "explosion_codex"
PALETTE_ID = "area51_omega_library_palette"

# Existing Area51 SCREEN 5 palette, indexed by the Mideas palette slot.
PALETTE = {
    0: (0, 0, 0, 0),
    1: (0, 0, 0, 255),
    2: (0, 36, 73, 255),
    3: (0, 73, 109, 255),
    4: (36, 109, 146, 255),
    5: (73, 109, 146, 255),
    6: (36, 36, 36, 255),
    7: (73, 73, 73, 255),
    8: (109, 109, 109, 255),
    9: (146, 146, 146, 255),
    10: (255, 36, 0, 255),
    11: (219, 219, 109, 255),
    12: (255, 109, 73, 255),
    13: (182, 219, 0, 255),
    14: (36, 146, 219, 255),
    15: (255, 255, 255, 255),
}

USED_SLOTS = (0, 6, 7, 10, 11, 12, 15)


def paint(tile: list[list[int]], points: list[tuple[int, int]], slot: int) -> None:
    for x, y in points:
        if not (0 <= x < 16 and 0 <= y < 16):
            raise ValueError(f"point outside 16x16 tile: {(x, y)}")
        tile[y][x] = slot


def row_range(y: int, start: int, end: int) -> list[tuple[int, int]]:
    return [(x, y) for x in range(start, end + 1)]


def frame_one() -> list[int]:
    """Compact detonation: dense body, hot white core, short sparks."""
    tile = [[0 for _ in range(16)] for _ in range(16)]

    # Small smoke puffs already entering the silhouette of the blast.
    paint(tile, [(11, 2), (12, 2), (11, 3), (12, 3), (13, 3)], 6)
    paint(tile, [(12, 2), (12, 3), (13, 3)], 7)
    paint(tile, [(2, 11), (3, 11), (2, 12), (3, 12), (4, 12)], 6)
    paint(tile, [(3, 11), (3, 12), (4, 12)], 7)

    # Compact warning-colour sparks.
    paint(tile, [(7, 0), (7, 1), (7, 2)], 10)
    paint(tile, [(1, 7), (2, 7), (2, 8)], 10)
    paint(tile, [(13, 7), (14, 7), (14, 8)], 10)
    paint(tile, [(8, 13), (8, 14)], 10)
    paint(tile, [(3, 2), (3, 3), (4, 3)], 12)
    paint(tile, [(12, 11), (13, 11), (12, 12)], 12)

    # Irregular orange star body.
    for y, start, end in (
        (3, 7, 8),
        (4, 5, 10),
        (5, 4, 11),
        (6, 3, 12),
        (7, 3, 12),
        (8, 2, 13),
        (9, 3, 12),
        (10, 3, 12),
        (11, 4, 11),
        (12, 6, 9),
    ):
        paint(tile, row_range(y, start, end), 12)

    # Red-hot perimeter clusters make the silhouette read at native scale.
    for point in (
        (7, 3), (5, 4), (10, 4), (4, 5), (11, 5), (3, 6), (12, 6),
        (3, 7), (12, 7), (2, 8), (13, 8), (3, 9), (12, 9), (3, 10),
        (12, 10), (4, 11), (11, 11), (6, 12), (9, 12),
    ):
        paint(tile, [point], 10)

    # Yellow body, slightly asymmetric toward the lower-right.
    for y, start, end in (
        (4, 7, 8),
        (5, 5, 10),
        (6, 5, 10),
        (7, 4, 11),
        (8, 4, 11),
        (9, 5, 10),
        (10, 5, 10),
        (11, 7, 8),
    ):
        paint(tile, row_range(y, start, end), 11)

    # White core is a compact cross, not a uniform square.
    paint(tile, [(7, 5), (8, 5)], 15)
    paint(tile, [(6, 6), (7, 6), (8, 6), (9, 6)], 15)
    paint(tile, [(6, 7), (7, 7), (8, 7), (9, 7)], 15)
    paint(tile, [(6, 8), (7, 8), (8, 8), (9, 8)], 15)
    paint(tile, [(7, 9), (8, 9)], 15)
    return [value for row in tile for value in row]


def frame_two() -> list[int]:
    """Expanded detonation: the same hot centre breaking into fragments."""
    tile = [[0 for _ in range(16)] for _ in range(16)]

    # Four separated smoke fragments: dark core + lighter cap.
    smoke_groups = [
        ([(2, 3), (3, 3), (2, 4), (3, 4), (4, 4)], [(3, 3), (3, 4)]),
        ([(11, 2), (12, 2), (11, 3), (12, 3), (13, 3)], [(12, 2), (12, 3)]),
        ([(3, 11), (4, 11), (3, 12), (4, 12), (5, 12)], [(4, 11), (4, 12)]),
        ([(11, 11), (12, 11), (12, 12), (13, 12)], [(12, 11), (12, 12)]),
    ]
    for dark, light in smoke_groups:
        paint(tile, dark, 6)
        paint(tile, light, 7)

    # Long, broken sparks radiate from the former centre.
    paint(tile, [(7, 0), (7, 1), (8, 1), (8, 2)], 10)
    paint(tile, [(1, 7), (2, 7), (2, 8), (3, 8)], 10)
    paint(tile, [(13, 7), (14, 7), (13, 8), (14, 8)], 10)
    paint(tile, [(7, 13), (7, 14), (8, 14), (8, 15)], 10)
    paint(tile, [(4, 1), (4, 2)], 12)
    paint(tile, [(11, 5), (12, 5), (12, 6)], 12)
    paint(tile, [(3, 13), (4, 13)], 12)
    paint(tile, [(11, 14), (12, 14)], 12)

    # A smaller central fireball, with transparent gaps separating fragments.
    paint(tile, [(6, 5), (7, 5), (8, 5)], 10)
    paint(tile, [(5, 6), (6, 6), (7, 6), (8, 6), (9, 6), (10, 6)], 12)
    paint(tile, [(5, 7), (6, 7), (7, 7), (8, 7), (9, 7), (10, 7)], 12)
    paint(tile, [(4, 8), (5, 8), (6, 8), (7, 8), (8, 8), (9, 8), (10, 8), (11, 8)], 10)
    paint(tile, [(5, 9), (6, 9), (7, 9), (8, 9), (9, 9), (10, 9)], 12)
    paint(tile, [(6, 10), (7, 10), (8, 10), (9, 10)], 10)

    # Bright fragments keep the second frame connected to frame one.
    paint(tile, [(7, 6), (8, 6), (6, 7), (7, 7), (8, 7)], 11)
    paint(tile, [(8, 8), (9, 8), (7, 9), (8, 9)], 11)
    paint(tile, [(7, 7), (8, 7), (7, 8)], 15)
    paint(tile, [(10, 4), (11, 4)], 11)
    paint(tile, [(2, 9), (3, 9)], 11)
    paint(tile, [(12, 9), (13, 9)], 11)
    return [value for row in tile for value in row]


def palette_entries() -> list[dict[str, object]]:
    entries = []
    for slot in range(16):
        rgba = PALETTE[slot]
        if slot == 0:
            entries.append({"slotIndex": 0, "masterIndex": -1, "hex": "rgba(0,0,0,0)"})
        else:
            entries.append({
                "slotIndex": slot,
                "masterIndex": slot,
                "hex": "#%02X%02X%02X" % rgba[:3],
            })
    return entries


def tile_json(tile_id: str, name: str, pixels: list[int], now: str) -> dict[str, object]:
    return {
        "tile": {
            "id": tile_id,
            "name": name,
            "mode": "SCREEN5_BITMAP",
            "width": 16,
            "height": 16,
            "sourceType": "hand-authored-area51-pixelart",
            "paletteId": PALETTE_ID,
            "pixelData": pixels,
            "tags": ["area51", "explosion", "boss-fx", "screen5", "16x16"],
            "createdAt": now,
            "updatedAt": now,
            "notes": "Codex contest entry: two-frame boss explosion. Slots 15 white core, 11 yellow body, 12 orange edge, 10 red sparks, 7/6 smoke, 0 transparent.",
        },
        "palette": [palette_entries()[slot] for slot in USED_SLOTS],
    }


def render_tile(pixels: list[int], scale: int = 1, backdrop: bool = False) -> Image.Image:
    background = PALETTE[2] if backdrop else PALETTE[0]
    image = Image.new("RGBA", (16, 16), background)
    for y in range(16):
        for x in range(16):
            slot = pixels[y * 16 + x]
            if slot != 0 or not backdrop:
                image.putpixel((x, y), PALETTE[slot])
    if scale != 1:
        image = image.resize((16 * scale, 16 * scale), Image.Resampling.NEAREST)
    return image


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    frame_a = frame_one()
    frame_b = frame_two()
    id_a = "bitmap_tile_screen5_area51_codex_explosion_compact_20260822"
    id_b = "bitmap_tile_screen5_area51_codex_explosion_expanded_20260822"

    for filename, pixels in (
        ("explosion_compact_16x16.png", frame_a),
        ("explosion_expanded_16x16.png", frame_b),
    ):
        render_tile(pixels).save(OUTPUT / filename)
        render_tile(pixels, scale=8, backdrop=True).convert("RGB").save(
            OUTPUT / filename.replace(".png", "_zoom.png")
        )

    preview = Image.new("RGB", (16 * 8 * 2, 16 * 8), PALETTE[2][:3])
    preview.paste(render_tile(frame_a, scale=8, backdrop=True).convert("RGB"), (0, 0))
    preview.paste(render_tile(frame_b, scale=8, backdrop=True).convert("RGB"), (16 * 8, 0))
    preview.save(OUTPUT / "explosion_codex_frames_preview_8x.png")

    (OUTPUT / "explosion_compact_16x16_tile.json").write_text(
        json.dumps(tile_json(id_a, "Codex Explosion Compact 16x16", frame_a, now), indent=2) + "\n",
        encoding="utf-8",
    )
    (OUTPUT / "explosion_expanded_16x16_tile.json").write_text(
        json.dumps(tile_json(id_b, "Codex Explosion Expanded 16x16", frame_b, now), indent=2) + "\n",
        encoding="utf-8",
    )

    stamp_id = "bitmap_stamp_screen5_area51_codex_explosion_2frames_20260822"
    stamp = {
        "id": stamp_id,
        "name": "Codex Area51 Explosion 2 Frames 16x16",
        "mode": "SCREEN5_BITMAP_STAMP",
        "columns": 2,
        "rows": 1,
        "tileWidth": 16,
        "tileHeight": 16,
        "sourceType": "hand-authored-area51-pixelart",
        "sourceFileName": "explosion_codex_frames_preview_8x.png",
        "paletteId": PALETTE_ID,
        "tiles": [
            {"id": id_a, "name": "Codex Explosion Compact 16x16", "width": 16, "height": 16, "pixelData": frame_a, "frame": 1},
            {"id": id_b, "name": "Codex Explosion Expanded 16x16", "width": 16, "height": 16, "pixelData": frame_b, "frame": 2},
        ],
        "tags": ["area51", "explosion", "boss-fx", "screen5", "16x16", "animation"],
        "createdAt": now,
        "updatedAt": now,
    }
    stamp_asset = {
        "id": stamp_id,
        "name": stamp["name"],
        "type": "msx2bitmapstamp",
        "data": {
            "id": stamp_id,
            "name": stamp["name"],
            "savedAt": int(datetime.now(timezone.utc).timestamp() * 1000),
            "stamp": stamp,
            "palette": palette_entries(),
        },
    }
    (OUTPUT / "explosion_codex_2frame_stamp.asset.json").write_text(
        json.dumps(stamp_asset, indent=2) + "\n", encoding="utf-8"
    )
    (OUTPUT / "explosion_codex_palette.json").write_text(
        json.dumps({"id": PALETTE_ID, "name": "Area51 Omega Library Palette", "mode": "SCREEN5", "slots": palette_entries()}, indent=2) + "\n",
        encoding="utf-8",
    )
    (OUTPUT / "explosion_codex_manifest.json").write_text(
        json.dumps({
            "entry": "Codex",
            "paletteId": PALETTE_ID,
            "tileSize": [16, 16],
            "frames": [
                {"frame": 1, "id": id_a, "file": "explosion_compact_16x16_tile.json", "role": "compact detonation"},
                {"frame": 2, "id": id_b, "file": "explosion_expanded_16x16_tile.json", "role": "expanded fragments"},
            ],
            "usedSlots": list(USED_SLOTS),
            "validation": {
                "eachFramePixels": 256,
                "backgroundSlot": 0,
                "previewBackdrop": "#002449",
            },
        }, indent=2) + "\n", encoding="utf-8"
    )

    for label, pixels in (("compact", frame_a), ("expanded", frame_b)):
        assert len(pixels) == 256
        assert all(0 <= value <= 15 for value in pixels)
        print(f"{label}: pixels=256 visible={sum(value != 0 for value in pixels)} slots={sorted(set(pixels))}")
    print(f"output={OUTPUT}")


if __name__ == "__main__":
    main()
