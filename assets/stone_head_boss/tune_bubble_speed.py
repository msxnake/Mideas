"""Apply the stone head's slower bubble speed to an installed project."""

from __future__ import annotations

import json
import os
import shutil
import sys
from pathlib import Path

from install_stone_head import BOSS_ID, PROJECT, SHOOT_ID


def main() -> None:
    project_path = Path(sys.argv[1]) if len(sys.argv) > 1 else PROJECT
    project = json.loads(project_path.read_text(encoding="utf-8"))
    assets = {asset["id"]: asset for asset in project["assets"]}
    boss = assets[BOSS_ID]["data"]
    shoot = assets[SHOOT_ID]["data"]
    boss["bossProjectileSpeed"] = 2
    for phase in boss["bossPhases"]:
        phase["projectileSpeed"] = 2
    shoot["speed"] = 2

    backup = project_path.with_name(project_path.stem + ".before-bubble-timing" + project_path.suffix)
    if not backup.exists():
        shutil.copy2(project_path, backup)
    temporary = project_path.with_name(project_path.stem + ".bubble-writing" + project_path.suffix)
    try:
        with temporary.open("w", encoding="utf-8", newline="\n") as handle:
            json.dump(project, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temporary, project_path)
    finally:
        temporary.unlink(missing_ok=True)
    print(f"Updated {project_path}; backup {backup}")


if __name__ == "__main__":
    main()
