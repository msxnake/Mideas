"""Move the rival alien to pan18, preserving Spider and the source project.

Usage: python scripts/place_rival_in_pan18.py C:/Users/salam/Downloads/test623.json
"""

from __future__ import annotations

import copy
import json
import os
import shutil
import sys
from pathlib import Path


PAN18 = "bitmap_room_bitmapPlatform_mymsxgame_east_east_east_east_east_east_east"
AREA51_RIVAL = "bitmap_room_area51_rival_monarch_20260923"
WORLD_AREA51 = "worldmap_1787108640858"
BOSS = "msx2boss_area51_rival_monarch_20260923"
STAMP = "msx2bitmapstamp_alien_rival_48"
PALETTE = "palette_screen5_pan18_rival_20260923"
LASER_TILE = "atlas_pan18_rival_laser_20260923"


def rgb(hex_color: str) -> tuple[int, int, int]:
    return tuple(int(hex_color[i : i + 2], 16) for i in (1, 3, 5))


def map_palette(source: list[dict], target: list[dict]) -> dict[int, int]:
    target_rgb = {slot["slotIndex"]: rgb(slot["hex"]) for slot in target if slot["slotIndex"]}
    mapping = {0: 0}
    for slot in source:
        index = slot["slotIndex"]
        if index == 0:
            continue
        r, g, b = rgb(slot["hex"])
        mapping[index] = min(
            target_rgb,
            key=lambda candidate: sum((a - c) ** 2 for a, c in zip((r, g, b), target_rgb[candidate])),
        )
    # SCREEN 5 has no room for every intermediate shade. Keep the boss's
    # neutral armour neutral and its blue shell blue instead of allowing the
    # nearest RGB triplet to turn those pixels brown or grey.
    mapping.update({4: 3, 5: 3, 7: 7, 8: 14})
    return mapping


def remap_stamp(stamp_asset: dict, palette: list[dict], mapping: dict[int, int]) -> None:
    library = stamp_asset["data"]
    library["palette"] = copy.deepcopy(palette)
    stamp = library["stamp"]
    stamp["paletteId"] = PALETTE
    tiles = list(stamp["tiles"])
    for variant in stamp.get("frameVariants", []):
        tiles.extend(cell["tile"] for cell in variant.get("cells", []))
    for tile in tiles:
        tile["paletteId"] = PALETTE
        tile["pixelData"] = [mapping[int(index)] for index in tile["pixelData"]]


def save_json(path: Path, value: dict) -> None:
    temp = path.with_name(path.stem + ".pan18-writing" + path.suffix)
    try:
        with temp.open("w", encoding="utf-8", newline="\n") as handle:
            json.dump(value, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temp, path)
    finally:
        if temp.exists():
            temp.unlink()


def place(project_path: Path) -> None:
    project = json.loads(project_path.read_text(encoding="utf-8"))
    assets = project["assets"]
    by_id = {asset["id"]: asset for asset in assets}
    room = by_id[PAN18]["data"]
    boss = by_id[BOSS]["data"]
    if any(entity.get("params", {}).get("bossId") == BOSS for entity in room["entities"]):
        print("Monarca Rival is already in pan18")
        return
    spiders = [entity for entity in room["entities"] if entity.get("params", {}).get("bossId") == "msx2boss_1789766732423"]
    if len(spiders) != 1:
        raise ValueError("Expected one Spider encounter in pan18")
    if len(room["entities"]) != 2:
        raise ValueError("Unexpected additional pan18 entities; review placement before replacing Spider")

    backup = project_path.with_name(project_path.stem + ".before-monarca-pan18" + project_path.suffix)
    if not backup.exists():
        shutil.copy2(project_path, backup)
    spider_saved = project_path.with_name(project_path.stem + ".spider-pan18-encounter.json")
    if not spider_saved.exists():
        spider_saved.write_text(json.dumps({
            "roomId": PAN18,
            "entity": spiders[0],
            "bossDefinition": by_id["msx2boss_1789766732423"],
            "path": by_id.get("msx2bosspath_1789766798838"),
        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    source_palette = by_id[STAMP]["data"]["palette"]
    target_palette = room["palette"]
    mapping = map_palette(source_palette, target_palette)
    remap_stamp(by_id[STAMP], target_palette, mapping)
    assets.append({"id": PALETTE, "name": "Monarca Rival - paleta pan18", "type": "palette", "data": {
        "name": "Monarca Rival - paleta pan18", "mode": "SCREEN5", "slots": copy.deepcopy(target_palette),
        "source": "pan18-room", "notes": "Palette used by Monarca Rival in the pan18 world.",
    }})

    for sprite_id, body_color in (
        ("msx2sprite_area51_rival_cyan_20260923", "#2492DB"),
        ("msx2sprite_area51_rival_red_20260923", "#FF2400"),
    ):
        sprite = by_id[sprite_id]["data"]
        sprite["palette"] = copy.deepcopy(target_palette)
        sprite["hardware"]["color"] = 3 if body_color == "#2492DB" else 2
        for frame in sprite["frames"]:
            frame["data"] = [["#FF9292" if pixel == "#FF6D49" else pixel for pixel in row] for row in frame["data"]]

    source_atlas = by_id["bitmap_room_area51_defense_omega_20260818"]["data"]["atlas"]
    source_laser = next(entry for entry in source_atlas["entries"] if entry["id"] == "atlas_area51_omega_laser_horizontal")
    atlas = room["atlas"]
    atlas_y = atlas["height"]
    atlas["pixels"].extend([[0] * atlas["width"] for _ in range(16)])
    for dy in range(16):
        for dx in range(16):
            source_index = source_atlas["pixels"][source_laser["sy"] + dy][source_laser["sx"] + dx]
            atlas["pixels"][atlas_y + dy][dx] = mapping[source_index]
    atlas["height"] += 16
    atlas["entries"].append({
        "id": LASER_TILE, "name": "Monarca laser", "sx": 0, "sy": atlas_y,
        "w": 16, "h": 16, "sourceAssetId": "", "collisionFlags": 0,
    })
    boss["bossLaserTileId"] = LASER_TILE
    boss["bossBarrierTileId"] = "atlas_autotile_template_tierra_m15_1783124839369_5"
    boss["bossDeathExplosionStampIds"] = ["exp4_1785787304009", "exp3_1785787255734", "exp5_1785787396102"]
    boss["notes"] = "Monarca Rival in pan18: opaque 48x48 body on the room's black interior; moving HMMM remains fast. Spider encounter is saved separately."
    by_id["msx2shoot_area51_rival_laser_20260923"]["data"]["laserTileId"] = LASER_TILE

    placed = copy.deepcopy(by_id[AREA51_RIVAL]["data"]["entities"][0])
    placed["id"] = "msx2_entity_pan18_rival_monarch_20260923"
    placed["position"] = {"x": 10, "y": 3}
    room["entities"] = [entity for entity in room["entities"] if entity is not spiders[0]] + [placed]
    room["notes"] = str(room.get("notes") or "") + " Monarca Rival replaces Spider here; Spider's definition and a full project backup remain available."

    # The extra Area 51 chamber was an earlier placement for this same boss.
    # Remove that encounter so the player sees one definitive Monarca battle.
    project["assets"] = [asset for asset in assets if asset["id"] != AREA51_RIVAL]
    world = by_id[WORLD_AREA51]["data"]
    removed_nodes = {node["id"] for node in world["nodes"] if node.get("screenAssetId") == AREA51_RIVAL}
    world["nodes"] = [node for node in world["nodes"] if node["id"] not in removed_nodes]
    world["connections"] = [connection for connection in world["connections"]
                            if connection["fromNodeId"] not in removed_nodes and connection["toNodeId"] not in removed_nodes]

    save_json(project_path, project)
    print(f"Monarca Rival placed in pan18: {project_path}")
    print(f"Backup: {backup}")
    print(f"Spider encounter: {spider_saved}")
    print(f"Stamp palette map: {mapping}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    place(Path(sys.argv[1]).resolve())
