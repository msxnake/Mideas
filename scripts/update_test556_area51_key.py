"""Install the Codex Area51 key tile in the HUD and room pickup atlases."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
from build_test556_area51_key_asset import handcrafted_pixel_data  # noqa: E402


KEY_TILE_ID = "bitmap_tile_screen5_area51_codex_security_key_20260822"
HUD_ICON_ID = "hud_icon_area51_codex_security_key_20260822"
OLD_ATLAS_ENTRY_ID = "atlas_key_1_2_1783424346507_0"
ATLAS_ENTRY_ID = "atlas_key_codex_area51_security_20260822_0"
HUD_ID = "msx2hud_1782922069276"
PALETTE_ID = "palette_screen5_area51_defense_omega_20260818"


def hud_pixels(pixel_data: list[int]) -> list[list[int]]:
    # Crop the 16x16 source's one-pixel transparent frame to the HUD's 14x14 icon box.
    return [
        [-1 if pixel_data[y * 16 + x] == 0 else pixel_data[y * 16 + x] for x in range(1, 15)]
        for y in range(1, 15)
    ]


def install_room_key_visuals(assets: list[dict], pixel_data: list[int]) -> tuple[int, int]:
    """Replace the atlas tile used by key pickups in every bitmap room."""
    room_count = 0
    entity_count = 0
    for asset in assets:
        data = asset.get("data")
        if not isinstance(data, dict):
            continue
        atlas = data.get("atlas")
        if isinstance(atlas, dict) and isinstance(atlas.get("entries"), list):
            entry = next(
                (
                    candidate
                    for candidate in atlas["entries"]
                    if candidate.get("id") in (OLD_ATLAS_ENTRY_ID, ATLAS_ENTRY_ID)
                ),
                None,
            )
            if entry is not None:
                entry["id"] = ATLAS_ENTRY_ID
                entry["name"] = "A51 Codex Security Key 16x16"
                sx = int(entry.get("sx", 0))
                sy = int(entry.get("sy", 0))
                pixels = atlas.get("pixels")
                if isinstance(pixels, list) and sy + 16 <= len(pixels):
                    for row_index in range(16):
                        row = pixels[sy + row_index]
                        if isinstance(row, list) and sx + 16 <= len(row):
                            start = row_index * 16
                            row[sx:sx + 16] = pixel_data[start:start + 16]
                room_count += 1

        for entity in data.get("entities", []):
            params = entity.get("params") if isinstance(entity, dict) else None
            if not isinstance(params, dict):
                continue
            if params.get("keyPickupAtlasEntryId") in (OLD_ATLAS_ENTRY_ID, ATLAS_ENTRY_ID):
                params["keyPickupAtlasEntryId"] = ATLAS_ENTRY_ID
                entity_count += 1
    return room_count, entity_count


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-json", type=Path, required=True)
    parser.add_argument("--backup", type=Path, required=True)
    args = parser.parse_args()

    with args.project_json.open("r", encoding="utf-8") as handle:
        project = json.load(handle)
    shutil.copy2(args.project_json, args.backup)

    pixel_data = handcrafted_pixel_data()
    stamp = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    assets = project.setdefault("assets", [])
    assets[:] = [asset for asset in assets if asset.get("id") != KEY_TILE_ID]
    assets.append(
        {
            "id": KEY_TILE_ID,
            "type": "msx2bitmaptile",
            "name": "A51 Codex Security Key 16x16",
            "data": {
                "id": KEY_TILE_ID,
                "name": "A51 Codex Security Key 16x16",
                "mode": "SCREEN5_BITMAP",
                "width": 16,
                "height": 16,
                "sourceType": "hand-authored-area51-pixelart",
                "paletteId": PALETTE_ID,
                "pixelData": pixel_data,
                "createdAt": stamp,
                "updatedAt": stamp,
                "notes": "Codex contest entry: transparent 16x16 Area51 key with ring, shaft and two teeth.",
            },
        }
    )
    room_count, entity_count = install_room_key_visuals(assets, pixel_data)

    hud = next(asset for asset in assets if asset.get("id") == HUD_ID)
    hud_data = hud["data"]
    hud_data["icons"] = [icon for icon in hud_data.get("icons", []) if icon.get("id") != HUD_ICON_ID]
    hud_data["icons"].append(
        {
            "id": HUD_ICON_ID,
            "name": "Key Codex Area51 Fresh",
            "width": 14,
            "height": 14,
            "pixels": hud_pixels(pixel_data),
        }
    )
    key_layer = next(
        layer
        for layer in hud_data["layers"]
        if layer.get("name") == "Key Counter"
    )
    key_layer["element"]["atlasEntryId"] = HUD_ICON_ID
    hud_data["notes"] = (
        "HUD refinado con entrada de concurso Codex: llave Area51 16x16 enlazada "
        "al iconCounter de Key Counter."
    )

    with args.project_json.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(project, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(f"installed={KEY_TILE_ID}")
    print(f"hud_icon={HUD_ICON_ID}")
    print(f"backup={args.backup}")
    print("tile_size=16x16")
    print("hud_icon_size=14x14")
    print("palette_slots=0,1,11,13,15")
    print(f"room_atlas_updates={room_count}")
    print(f"key_entity_updates={entity_count}")


if __name__ == "__main__":
    main()
