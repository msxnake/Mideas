#!/usr/bin/env python3
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def run_command(command: list[str], cwd: Path) -> None:
    completed = subprocess.run(command, cwd=str(cwd), capture_output=True, text=True)
    if completed.stdout.strip():
        print(completed.stdout.strip())
    if completed.stderr.strip():
        print(completed.stderr.strip(), file=sys.stderr)
    if completed.returncode != 0:
        raise RuntimeError(f"Command failed ({completed.returncode}): {' '.join(command)}")


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    temp_root = Path(tempfile.mkdtemp(prefix="mideas_manifest_json_verify_"))
    try:
        import atexit
        atexit.register(lambda: shutil.rmtree(temp_root, ignore_errors=True))
    except Exception:
        pass
    asm_output = temp_root / "manifest_json_verify.asm"
    rom_output = temp_root / "manifest_json_verify.rom"
    ts_build_dir = temp_root / "tsbuild_manifest_json_verify"
    artifact_dir = asm_output.parent / f"{asm_output.stem}_generated"
    manifest_path = artifact_dir / "packing_manifest.json"
    banks_path = artifact_dir / "banks.json"
    usage_path = artifact_dir / "project_usage.json"
    unused_report_path = artifact_dir / "unused_report.txt"
    budget_path = artifact_dir / "segment_budget.json"
    project_json = temp_root / "manifest_json_verify_project.json"
    project = json.loads((repo_root / "Examples" / "simple_sprite(2).json").read_text(encoding="utf-8"))
    template = next(
        (candidate for candidate in project["entityTemplates"] if candidate["id"] == "tpl_1758379412687_lfuzt"),
        None,
    )
    if template is None:
        raise AssertionError("Missing simple_sprite basic_sprite template")
    template["components"].append(
        {
            "definitionId": "comp_auto_control_script",
            "defaultValues": {
                "enabled": True,
                "startsOnScreenLoad": True,
                "loop": False,
                "defaultDialogueAssetId": "",
                "idleSpriteAssetId": "",
                "walkSpriteAssetId": "",
                "scriptFormat": "eventString",
                "eventString": "x1",
                "commands": "",
            },
        }
    )
    template["components"].append(
        {
            "definitionId": "comp_mirror",
            "defaultValues": {
                "enabled": True,
                "invertFacing": True,
            },
        }
    )
    template["components"].append(
        {
            "definitionId": "comp_behavior",
            "defaultValues": {
                "behaviorType": "walk_x_wall_turn",
                "initialDirection": "right",
                "speed": "1",
                "range": "64",
                "stopDistance": "4",
            },
        }
    )
    project["assets"].append(
        {
            "id": "statemachine_manifest_usage",
            "name": "Manifest StateMachine Usage",
            "type": "statemachine",
            "data": {
                "id": "statemachine_manifest_usage",
                "name": "Manifest StateMachine Usage",
                "states": [
                    {"id": "state_idle", "name": "Idle", "properties": {}},
                    {"id": "state_walk", "name": "Walking", "properties": {}},
                ],
                "events": [],
                "transitions": [
                    {
                        "id": "transition_walk_right",
                        "fromStateId": "state_idle",
                        "toStateId": "state_walk",
                        "conditions": {
                            "type": "KEY_PRESSED",
                            "params": {"key": "right"},
                        },
                        "actions": [
                            {
                                "type": "SET_VELOCITY",
                                "params": {"x": 1, "y": 0},
                            }
                        ],
                    }
                ],
                "initialStateId": "state_idle",
            },
        }
    )
    project_json.write_text(json.dumps(project, indent=2), encoding="utf-8")

    run_command(
        [
            sys.executable,
            "scripts/build_mideas_unified_rom.py",
            "--json",
            str(project_json),
            "--project-root",
            ".",
            "--asm-output",
            str(asm_output),
            "--rom-output",
            str(rom_output),
            "--ts-build-dir",
            str(ts_build_dir),
            "--skip-zx0-preprocess",
            "--rom-mode",
            "megarom",
            "--target-format",
            "konami",
        ],
        repo_root,
    )

    if not manifest_path.exists():
        raise AssertionError(f"Missing packing manifest JSON: {manifest_path}")
    if not banks_path.exists():
        raise AssertionError(f"Missing banks JSON: {banks_path}")
    if not usage_path.exists():
        raise AssertionError(f"Missing project usage JSON: {usage_path}")
    if not unused_report_path.exists():
        raise AssertionError(f"Missing unused report: {unused_report_path}")
    if not budget_path.exists():
        raise AssertionError(f"Missing segment budget: {budget_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    banks = json.loads(banks_path.read_text(encoding="utf-8"))
    usage = json.loads(usage_path.read_text(encoding="utf-8"))
    budget = json.loads(budget_path.read_text(encoding="utf-8"))
    optimizer = json.loads((artifact_dir / "bank_optimizer.json").read_text(encoding="utf-8"))
    unused_report = unused_report_path.read_text(encoding="utf-8")
    asm_text = asm_output.read_text(encoding="utf-8", errors="ignore")
    assert manifest["version"] == 1
    assert usage["version"] == 1
    assert usage["scope"] == "konami8k_megarom_data"
    assert budget["version"] == 1
    assert budget["scope"] == "konami8k_segment_budget"
    assert budget["segmentSize"] == 8192
    assert len(budget["codeBanks"]) > 0
    assert len(budget["dataBanks"]) == len(manifest["banks"])
    assert "Scope: konami8k_megarom_resident_modules" in unused_report
    assert "Estimated removable bytes:" in unused_report
    assert manifest["mapper"]["dataWindowPage"] == "p3"
    assert manifest["mapper"]["windowBase"] == "#A000"
    assert manifest["mapper"]["windowMask"] == "#1FFF"
    assert manifest["mapper"]["bankDivisor"] == "#2000"
    assert manifest["mapper"]["zoneSize"] == 8192
    assert manifest["summary"]["resourceCount"] > 0
    assert manifest["summary"]["overflowCount"] == 0
    assert banks["version"] == 1
    assert banks["segmentSize"] == 8192
    assert banks["dataWindow"]["page"] == "p3"
    assert banks["dataWindow"]["base"] == "#A000"
    assert banks["dataWindow"]["mask"] == "#1FFF"
    assert banks["dataWindow"]["bankDivisor"] == "#2000"
    assert len(banks["banks"]) == manifest["summary"]["zoneCount"]

    resource_count = 0
    resource_ids: set[int] = set()
    for bank in manifest["banks"]:
        expected_origin = 0x4000 + (bank["bank"] * manifest["mapper"]["zoneSize"])
        assert bank["orgAddress"] == expected_origin
        assert bank["endAddress"] == expected_origin + manifest["mapper"]["zoneSize"]
        if bank["usedBytes"] + bank["freeBytes"] != manifest["mapper"]["zoneSize"]:
            raise AssertionError(f"Bank {bank['bank']} accounting mismatch")
        for resource in bank["resources"]:
            resource_count += 1
            resource_ids.add(resource["id"])
            window_address = resource["windowAddress"]
            size = resource["size"]
            if not 0xA000 <= window_address <= 0xBFFF:
                raise AssertionError(f"{resource['label']} outside A000h-BFFFh")
            if window_address + size - 1 > 0xBFFF:
                raise AssertionError(f"{resource['label']} crosses 8KB data window")
            if not re.match(r"^[A-Z0-9_]+$", resource["group"]):
                raise AssertionError(f"Unexpected group key: {resource['group']}")
            if not resource.get("placementReason"):
                raise AssertionError(f"Missing placement reason for {resource['label']}")

    assert resource_count == manifest["summary"]["resourceCount"]
    assert usage["counts"]["bankedResources"] == resource_count
    assert len(usage["bankedResources"]) == resource_count
    for key in (
        "bosses",
        "bossInstances",
        "bossAttackTypes",
        "bossAttacksReferenced",
        "dialogues",
        "worldmaps",
        "presentationScreens",
        "stateMachineActionTypes",
        "stateMachineConditionTypes",
    ):
        if key not in usage["counts"]:
            raise AssertionError(f"Missing project_usage count: {key}")
    for key in ("bosses", "dialogues", "worldmaps"):
        if key not in usage["features"]:
            raise AssertionError(f"Missing project_usage feature: {key}")
    reachability = usage["gameFlowReachability"]
    assert reachability["counts"]["totalScreens"] == usage["counts"]["screens"]
    assert len(reachability["scenes"]) == usage["counts"]["screens"]
    assert "reachableScreenIds" in reachability
    assert "bossAttackRuntime" in usage
    assert "usedTypes" in usage["bossAttackRuntime"]
    assert "unusedTypes" in usage["bossAttackRuntime"]
    assert "stateMachineRuntime" in usage
    assert usage["stateMachineRuntime"]["stateMachines"] == 1
    assert usage["stateMachineRuntime"]["transitions"] == 1
    assert usage["stateMachineRuntime"]["usedActionIds"] == [3]
    assert usage["stateMachineRuntime"]["usedConditionIds"] == [4]
    assert usage["stateMachineRuntime"]["usedActionTypes"] == ["SET_VELOCITY"]
    assert usage["stateMachineRuntime"]["usedConditionTypes"] == ["KEY_PRESSED"]
    assert "Mirror" in usage["componentRuntime"]["usedComponents"]
    assert "Behavior" in usage["componentRuntime"]["usedComponents"]
    assert "update_mirror_component:" in asm_text
    assert "BEHAVIOR_TYPE_WALK_X_WALL_TURN" in asm_text
    assert "behavior_turn_on_wall_d:" in asm_text
    assert "entity_behavior_cfg_type:" in asm_text
    assert "entity_behavior_cfg_dir:" in asm_text
    for key in (
        "usedActionIds",
        "usedActionTypes",
        "usedConditionIds",
        "usedConditionTypes",
        "actionTypeCounts",
        "conditionTypeCounts",
        "unknownActionTypes",
        "unknownConditionTypes",
    ):
        if key not in usage["stateMachineRuntime"]:
            raise AssertionError(f"Missing stateMachineRuntime key: {key}")
    assert any(group["key"] == "SPRITES" for group in usage["resourceGroups"])
    assert resource_ids == set(range(resource_count))
    assert sum(len(bank["resources"]) for bank in banks["banks"]) == resource_count
    for bank in banks["banks"]:
        expected_origin = 0x4000 + (bank["bank"] * banks["segmentSize"])
        assert bank["origin"] == expected_origin
        assert bank["end"] == expected_origin + banks["segmentSize"]
    assert all(
        0xA000 <= resource["address"] <= 0xBFFF
        for bank in banks["banks"]
        for resource in bank["resources"]
    )
    if "current_behavior_map_bank" in asm_text:
        assert "ld a, (current_behavior_map_bank)\n    call mapper_set_bank_p3" in asm_text
        assert "ld a, (current_behavior_map_bank)\n    call mapper_set_bank_p2" not in asm_text
    if "current_screen_layout_bank" in asm_text:
        assert "ld a, (current_screen_layout_bank)\n    call mapper_set_bank_p2" not in asm_text
    assert "; @mideas:block id=runtime.dialogue.system kind=routine owner=dialogues preserve=true" in asm_text
    assert "; @mideas:endblock id=runtime.dialogue.system" in asm_text
    proposed = optimizer["proposedPlacement"]
    assert proposed["zoneSize"] == manifest["mapper"]["zoneSize"]
    proposed_ids = []
    proposed_by_id = {}
    for bank in proposed["banks"]:
        placements = bank["resourcePlacements"]
        assert sorted(resource["id"] for resource in placements) == sorted(bank["resourceIds"])
        for resource in placements:
            proposed_ids.append(resource["id"])
            assert resource["bank"] == bank["bank"]
            assert resource["storedSize"] > 0
            assert resource["zoneOffset"] + resource["storedSize"] <= proposed["zoneSize"]
            assert resource["windowAddress"] == 0xA000 + resource["zoneOffset"]
            assert resource["placementReason"]
            proposed_by_id[resource["id"]] = (
                resource["bank"],
                resource["zoneOffset"],
                resource["windowAddress"],
                resource["storedSize"],
                resource["placementReason"],
            )
    assert sorted(proposed_ids) == list(range(resource_count))
    assert sorted(resource["id"] for resource in proposed["resourcePlacements"]) == list(range(resource_count))
    assert {
        resource["id"]: (
            resource["bank"],
            resource["zoneOffset"],
            resource["windowAddress"],
            resource["storedSize"],
            resource["placementReason"],
        )
        for resource in proposed["resourcePlacements"]
    } == proposed_by_id

    for target_format, expected_window_base, expected_zone_size in [
        ("ascii8", 0x8000, 8192),
        ("ascii16", 0x8000, 16384),
    ]:
        mapper_asm = temp_root / f"manifest_json_verify_{target_format}.asm"
        mapper_rom = temp_root / f"manifest_json_verify_{target_format}.rom"
        mapper_ts = temp_root / f"tsbuild_manifest_json_verify_{target_format}"
        mapper_artifacts = mapper_asm.parent / f"{mapper_asm.stem}_generated"
        run_command(
            [
                sys.executable,
                "scripts/build_mideas_unified_rom.py",
                "--json",
                "Examples/simple_sprite(2).json",
                "--project-root",
                ".",
                "--asm-output",
                str(mapper_asm),
                "--rom-output",
                str(mapper_rom),
                "--ts-build-dir",
                str(mapper_ts),
                "--skip-zx0-preprocess",
                "--rom-mode",
                "megarom",
                "--target-format",
                target_format,
            ],
            repo_root,
        )
        mapper_manifest = json.loads((mapper_artifacts / "packing_manifest.json").read_text(encoding="utf-8"))
        mapper_optimizer = json.loads((mapper_artifacts / "bank_optimizer.json").read_text(encoding="utf-8"))
        mapper_budget = json.loads((mapper_artifacts / "segment_budget.json").read_text(encoding="utf-8"))
        assert mapper_manifest["mapper"]["windowBase"] == f"#{expected_window_base:04X}"
        assert mapper_manifest["mapper"]["zoneSize"] == expected_zone_size
        mapper_resource_count = sum(len(bank["resources"]) for bank in mapper_manifest["banks"])
        mapper_proposed = mapper_optimizer["proposedPlacement"]
        assert mapper_proposed["zoneSize"] == expected_zone_size
        assert sorted(resource["id"] for resource in mapper_proposed["resourcePlacements"]) == list(range(mapper_resource_count))
        mapper_proposed_by_id = {}
        for bank in mapper_proposed["banks"]:
            for resource in bank["resourcePlacements"]:
                assert resource["zoneOffset"] + resource["storedSize"] <= expected_zone_size
                assert resource["windowAddress"] == expected_window_base + resource["zoneOffset"]
                assert resource["placementReason"]
                mapper_proposed_by_id[resource["id"]] = (
                    resource["bank"],
                    resource["zoneOffset"],
                    resource["windowAddress"],
                    resource["storedSize"],
                    resource["placementReason"],
                )
        assert {
            resource["id"]: (
                resource["bank"],
                resource["zoneOffset"],
                resource["windowAddress"],
                resource["storedSize"],
                resource["placementReason"],
            )
            for resource in mapper_proposed["resourcePlacements"]
        } == mapper_proposed_by_id
        if target_format == "ascii16":
            runtime_layout = mapper_budget["runtimeLayout"]
            if runtime_layout["residentEstimatedWindowOverflowCount"] > 0:
                assert runtime_layout["residentEstimatedWindowOverflowSamples"]
            if runtime_layout["residentEstimatedOutOfWindowLabelCount"] > 0:
                assert runtime_layout["residentEstimatedOutOfWindowLabelSamples"]
            if runtime_layout["residentEstimatedOutOfWindowCallCount"] > 0:
                assert runtime_layout["residentEstimatedOutOfWindowCallSamples"]
            if runtime_layout["farToFarDirectCallCount"] > 0:
                assert runtime_layout["farToFarDirectCallSamples"]
            if runtime_layout["lowerPageHiddenResidentCallCount"] > 0:
                assert runtime_layout["lowerPageHiddenResidentCallSamples"]
            assert isinstance(runtime_layout["residentBridgeCallCount"], int)
            assert isinstance(runtime_layout["residentBridgeCallSamples"], list)
            if runtime_layout["residentBridgeCallCount"] > 0:
                assert runtime_layout["residentBridgeCallSamples"]
                sample = runtime_layout["residentBridgeCallSamples"][0]
                assert isinstance(sample["bank"], int)
                assert sample["module"]
                assert sample["target"]
                assert sample["stub"]

    print(f"Packing manifest and banks JSON validation passed ({resource_count} resources)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
