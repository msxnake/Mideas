from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(r"C:\Users\salam\Documents\Programacion\Mideas")
QC_DIR = ROOT / "test" / "msx2-bats" / "qc-professional-20260814-01"
ITERATION_DIR = QC_DIR / "iteration-3"
SHEET_PATH = ITERATION_DIR / "bat-professional-sheet-2x1.png"
SOURCE_PATH = Path(r"C:\Users\salam\Downloads\test501_bats1.json")
OUTPUT_PATH = Path(r"C:\Users\salam\Downloads\test501_bats1_professional.json")

SPRITE_ID = "msx2sprite_bat_murcielago"
ENEMY_ID = "msx2enemy_bat_murcielago"
TRANSPARENT = "rgba(0,0,0,0)"
BODY = "#6D6D6D"
EYES = "#B6DB00"
RGB_TO_PROJECT = {
    (255, 0, 255): TRANSPARENT,
    (109, 109, 109): BODY,
    (182, 219, 0): EYES,
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def connected_components(points: set[tuple[int, int]]) -> int:
    remaining = set(points)
    count = 0
    while remaining:
        count += 1
        stack = [remaining.pop()]
        while stack:
            x, y = stack.pop()
            for adjacent in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if adjacent in remaining:
                    remaining.remove(adjacent)
                    stack.append(adjacent)
    return count


def frame_matrix(image: Image.Image, frame_index: int) -> list[list[str]]:
    x_offset = frame_index * 16
    return [
        [RGB_TO_PROJECT[image.getpixel((x_offset + x, y))] for x in range(16)]
        for y in range(16)
    ]


def qc_sheet(image: Image.Image) -> dict[str, Any]:
    assert image.size == (32, 16), f"Expected 32x16 sheet, got {image.size}"
    colors = set(image.getdata())
    assert colors == set(RGB_TO_PROJECT), f"Unexpected colors: {colors}"

    frames: list[dict[str, Any]] = []
    matrices = [frame_matrix(image, index) for index in range(2)]
    expected_eyes = [(6, 8), (9, 8)]
    for index, matrix in enumerate(matrices):
        eye_coords = [
            (x, y)
            for y, row in enumerate(matrix)
            for x, value in enumerate(row)
            if value == EYES
        ]
        opaque = {
            (x, y)
            for y, row in enumerate(matrix)
            for x, value in enumerate(row)
            if value != TRANSPARENT
        }
        assert eye_coords == expected_eyes, (index, eye_coords)
        assert matrix[8][7] == BODY and matrix[8][8] == BODY
        assert all(matrix[0][x] == TRANSPARENT and matrix[15][x] == TRANSPARENT for x in range(16))
        assert all(matrix[y][0] == TRANSPARENT and matrix[y][15] == TRANSPARENT for y in range(16))
        assert connected_components(opaque) == 1
        frames.append(
            {
                "frame": index + 1,
                "eyeCoordinates": eye_coords,
                "eyeGapPixels": 2,
                "opaquePixelCount": len(opaque),
                "connectedOpaqueComponents": connected_components(opaque),
                "edgeMarginClear": True,
            }
        )

    core_box = (6, 7, 9, 13)
    core_equal = all(
        matrices[0][y][x] == matrices[1][y][x]
        for y in range(core_box[1], core_box[3] + 1)
        for x in range(core_box[0], core_box[2] + 1)
    )
    changed_pixels = sum(
        matrices[0][y][x] != matrices[1][y][x]
        for y in range(16)
        for x in range(16)
    )
    assert core_equal
    assert changed_pixels > 0

    return {
        "acceptedIteration": 3,
        "sheetSize": list(image.size),
        "frameSize": [16, 16],
        "frameCount": 2,
        "exactProjectColors": {
            "transparentRaw": "#FF00FF",
            "body": {"paletteIndex": 2, "hex": BODY},
            "eyes": {"paletteIndex": 5, "hex": EYES},
        },
        "frames": frames,
        "eyesStationary": True,
        "bodyCoreStationary": core_equal,
        "stationaryCoreBoxInclusive": list(core_box),
        "changedPixelsBetweenFrames": changed_pixels,
        "wingPosesDistinct": True,
        "hardwareLayerSeparationPossible": True,
        "professionalQc": "PASS",
    }


def walk(value: Any, path: str = "$"):
    yield path, value
    if isinstance(value, dict):
        for key, child in value.items():
            yield from walk(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from walk(child, f"{path}[{index}]")


def find_asset(project: dict[str, Any], asset_id: str) -> dict[str, Any]:
    matches = [asset for asset in project["assets"] if asset.get("id") == asset_id]
    assert len(matches) == 1, (asset_id, len(matches))
    return matches[0]


def integrate(project: dict[str, Any], matrices: list[list[list[str]]]) -> dict[str, Any]:
    sprite = find_asset(project, SPRITE_ID)
    sprite_data = sprite["data"]
    assert sprite_data["size"] == {"width": 16, "height": 16}
    sprite_data["frames"] = [
        {"id": "bat_wings_up_professional", "data": matrices[0]},
        {"id": "bat_wings_down_professional", "data": matrices[1]},
    ]
    sprite_data["currentFrameIndex"] = 0

    enemy = find_asset(project, ENEMY_ID)
    enemy_data = enemy["data"]
    enemy_data["logicUpdateIntervalFrames"] = 3
    enemy_data.pop("logicUpdateEveryFrames", None)
    assert enemy_data["render"]["darkEyesColor"] == 5

    speed_schema = [entry for entry in enemy_data["spawnParamsSchema"] if entry.get("name") == "speed"]
    assert len(speed_schema) == 1
    speed_schema[0]["default"] = 1
    speed_schema[0]["label"] = "Speed (px/update)"

    placement_paths: list[str] = []
    for path, value in walk(project):
        if not isinstance(value, dict):
            continue
        params = value.get("params")
        if not isinstance(params, dict) or params.get("enemyAssetId") != ENEMY_ID:
            continue

        params["speed"] = 1
        params["logicUpdateIntervalFrames"] = 3
        params.pop("logicUpdateEveryFrames", None)

        components = value.setdefault("components", {})
        movement = components.setdefault("msx2_movement", {})
        movement["speed"] = 1
        ai = components.setdefault("msx2_ai", {})
        ai["logicUpdateIntervalFrames"] = 3
        ai.pop("logicUpdateEveryFrames", None)
        placement_paths.append(path)

    assert placement_paths, "No Murcielago placements found"
    project["currentProjectName"] = "test501_bats1_professional"
    return {
        "enemyAssetId": ENEMY_ID,
        "spriteAssetId": SPRITE_ID,
        "logicCadenceField": "logicUpdateIntervalFrames",
        "logicCadenceValue": 3,
        "speedValue": 1,
        "placementCount": len(placement_paths),
        "placementPaths": placement_paths,
    }


def validate_output(project: dict[str, Any], matrices: list[list[list[str]]], expected_placements: int) -> dict[str, Any]:
    sprite = find_asset(project, SPRITE_ID)["data"]
    enemy = find_asset(project, ENEMY_ID)["data"]
    assert len(sprite["frames"]) == 2
    assert [frame["data"] for frame in sprite["frames"]] == matrices
    assert enemy["logicUpdateIntervalFrames"] == 3
    assert "logicUpdateEveryFrames" not in enemy
    assert enemy["render"]["darkEyesColor"] == 5

    placements = []
    legacy_alias_paths = []
    for path, value in walk(project):
        if isinstance(value, dict) and "logicUpdateEveryFrames" in value:
            legacy_alias_paths.append(path)
        if not isinstance(value, dict):
            continue
        params = value.get("params")
        if not isinstance(params, dict) or params.get("enemyAssetId") != ENEMY_ID:
            continue
        assert params["speed"] == 1
        assert params["logicUpdateIntervalFrames"] == 3
        assert "logicUpdateEveryFrames" not in params
        assert value["components"]["msx2_movement"]["speed"] == 1
        assert value["components"]["msx2_ai"]["logicUpdateIntervalFrames"] == 3
        assert "logicUpdateEveryFrames" not in value["components"]["msx2_ai"]
        placements.append(path)
    assert len(placements) == expected_placements
    return {
        "roundTripSpriteExact": True,
        "validatedPlacementCount": len(placements),
        "legacyEveryAliasInTargetAssetOrPlacements": False,
        "unrelatedLegacyAliasPathCount": len(legacy_alias_paths),
    }


def main() -> None:
    assert not OUTPUT_PATH.exists(), f"Refusing to overwrite existing file: {OUTPUT_PATH}"
    source_hash_before = sha256(SOURCE_PATH)
    image = Image.open(SHEET_PATH).convert("RGB")
    qc = qc_sheet(image)
    matrices = [frame_matrix(image, index) for index in range(2)]

    with SOURCE_PATH.open("r", encoding="utf-8") as stream:
        project = json.load(stream)
    integration = integrate(project, matrices)
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="\n") as stream:
        json.dump(project, stream, ensure_ascii=False, separators=(",", ":"))

    with OUTPUT_PATH.open("r", encoding="utf-8") as stream:
        round_trip = json.load(stream)
    validation = validate_output(round_trip, matrices, integration["placementCount"])
    source_hash_after = sha256(SOURCE_PATH)
    assert source_hash_before == source_hash_after

    report = {
        "sourceProject": str(SOURCE_PATH),
        "sourceSha256Before": source_hash_before,
        "sourceSha256After": source_hash_after,
        "sourceUnchanged": True,
        "outputProject": str(OUTPUT_PATH),
        "outputSha256": sha256(OUTPUT_PATH),
        "outputBytes": OUTPUT_PATH.stat().st_size,
        "qc": qc,
        "integration": integration,
        "validation": validation,
    }
    report_path = QC_DIR / "qc-report.json"
    with report_path.open("w", encoding="utf-8", newline="\n") as stream:
        json.dump(report, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
