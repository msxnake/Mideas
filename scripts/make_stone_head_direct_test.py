"""Make a disposable test copy whose world starts in pan18 Este."""
from __future__ import annotations
import copy
import json
import sys
from pathlib import Path

src = Path(sys.argv[1]).resolve()
dst = Path(sys.argv[2]).resolve()
project = json.loads(src.read_text(encoding="utf-8"))
world_id = "worldmap_1781958895943"
room_id = "bitmap_room_bitmapPlatform_mymsxgame_east_east_east_east_east_east_east_east"
world = next(asset for asset in project["assets"] if asset["id"] == world_id)["data"]
first = world["nodes"][0]
first["screenAssetId"] = room_id
first["name"] = "pan18 Este (test directo)"
first["position"] = {"x": 0, "y": 0}
world["startScreenNodeId"] = first["id"]
project["selectedAssetId"] = room_id
dst.write_text(json.dumps(project, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(dst)
