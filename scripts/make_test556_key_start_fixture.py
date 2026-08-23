"""Create a non-destructive test556 fixture that starts in the key room."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--world-id", default="worldmap_1781958895943")
    parser.add_argument("--start-room-name", default="pan1")
    args = parser.parse_args()

    with args.source.open("r", encoding="utf-8") as handle:
        project = json.load(handle)

    flow = next(
        asset
        for asset in project["assets"]
        if asset.get("id") == "asset_bitmapPlatform_gameflow_1781954607779"
    )
    world_link = next(
        node
        for node in flow["data"]["nodes"]
        if node.get("type") == "WorldLink"
    )
    world_link["worldAssetId"] = args.world_id
    world = next(asset for asset in project["assets"] if asset.get("id") == args.world_id)
    start_node = next(
        node for node in world["data"]["nodes"] if node.get("name") == args.start_room_name
    )
    world["data"]["startScreenNodeId"] = start_node["id"]

    with args.output.open("w", encoding="utf-8") as handle:
        json.dump(project, handle, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main()
