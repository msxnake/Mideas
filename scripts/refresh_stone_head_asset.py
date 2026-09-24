"""Refresh the stone-head stamp after a source-art quantisation fix."""
from __future__ import annotations
import json
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "assets" / "stone_head_boss"))
from install_stone_head import build_stamp  # type: ignore

project_path = Path(sys.argv[1]).resolve()
project = json.loads(project_path.read_text(encoding="utf-8"))
assets = project["assets"]
by_id = {asset["id"]: asset for asset in assets}
room_id = "bitmap_room_bitmapPlatform_mymsxgame_east_east_east_east_east_east_east_east"
stamp_id = "msx2bitmapstamp_stone_head_right_20260923"
stamp = build_stamp(by_id[room_id]["data"]["palette"])
by_id[stamp_id]["data"] = stamp["data"]
backup = project_path.with_name(project_path.stem + ".before-stone-head-transparent" + project_path.suffix)
if not backup.exists():
    shutil.copy2(project_path, backup)
temp = project_path.with_name(project_path.stem + ".stone-refresh-writing" + project_path.suffix)
try:
    with temp.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(project, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    os.replace(temp, project_path)
finally:
    if temp.exists():
        temp.unlink()
print(f"Refreshed transparent stamp: {project_path}")
