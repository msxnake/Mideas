"""Install the Monarca Rival's closed/open arm frames in test623.json."""

from __future__ import annotations

import copy
import json
import os
import shutil
import sys
import time
from pathlib import Path

from place_rival_in_pan18 import map_palette, remap_stamp


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/area51_rival_boss/alien_rival_48.msx2bitmapstamp.json"
STAMP_ID = "msx2bitmapstamp_alien_rival_48"
BOSS_ID = "msx2boss_area51_rival_monarch_20260923"
ROOM_ID = "bitmap_room_bitmapPlatform_mymsxgame_east_east_east_east_east_east_east"


def update(project_path: Path) -> None:
    project = json.loads(project_path.read_text(encoding="utf-8"))
    assets = {asset["id"]: asset for asset in project["assets"]}
    room = assets[ROOM_ID]["data"]
    if not any(entity.get("params", {}).get("bossId") == BOSS_ID for entity in room["entities"]):
        raise ValueError("Monarca Rival is not placed in pan18")
    source = copy.deepcopy(json.loads(SOURCE.read_text(encoding="utf-8"))["entries"][0])
    mapping = map_palette(source["palette"], room["palette"])
    wrapper = {"data": source}
    remap_stamp(wrapper, room["palette"], mapping)
    stamp = assets[STAMP_ID]["data"]
    stamp["stamp"] = source["stamp"]
    stamp["palette"] = source["palette"]
    stamp["savedAt"] = int(time.time() * 1000)
    boss = assets[BOSS_ID]["data"]
    boss["bossFrames"] = 2
    boss["bossAnimDelay"] = 6
    for phase in boss["bossPhases"]:
        phase["bodyInterval"] = 3
    boss["notes"] = "Alternates closed and open pincers from the original high-resolution two-pose art. Both poses are 48x48 in the pan18 palette; the body updates every three frames while the player keeps its 60 Hz loop."

    backup = project_path.with_name(project_path.stem + ".before-rival-arm-cycle" + project_path.suffix)
    if not backup.exists():
        shutil.copy2(project_path, backup)
    temp = project_path.with_name(project_path.stem + ".arms-writing" + project_path.suffix)
    try:
        with temp.open("w", encoding="utf-8", newline="\n") as handle:
            json.dump(project, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temp, project_path)
    finally:
        if temp.exists():
            temp.unlink()
    print(f"Updated {STAMP_ID}: closed/open arms in {project_path}")
    print(f"Backup: {backup}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    update(Path(sys.argv[1]).resolve())
