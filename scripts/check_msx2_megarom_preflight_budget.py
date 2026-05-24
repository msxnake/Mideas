#!/usr/bin/env python3
"""Unit-style checks for the MSX2 MegaROM pre-Glass budget gate."""

from __future__ import annotations

import json
import sys
import tempfile
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path

sys.dont_write_bytecode = True

from build_mideas_unified_rom import (
    build_preflight_artifact_summaries,
    describe_glass_compile_failure,
    validate_msx2_preflight_with_safe_resolution,
    validate_msx2_screen4_megarom_preflight_budget,
    write_msx2_build_summary,
    write_msx2_compile_failure_summary,
)


def make_ram_budget(status: str = "ok", free_bytes: int = 12000) -> dict:
    used_bytes = 13056 - free_bytes
    return {
        "scope": "msx2_screen4_ram_budget",
        "start": "#C000",
        "end": "#C314",
        "limit": "#F300",
        "usableBytes": 13056,
        "usedBytes": used_bytes,
        "freeBytes": free_bytes,
        "warningThresholdBytes": 11097,
        "maxPersistentScreens": 65,
        "reachableScreens": 1,
        "status": status,
        "sections": [
            {"id": "runtime.persistent_effect_layers", "start": "#C080", "end": "#C140", "bytes": 192},
            {"id": "runtime.effects_scratch", "start": "#C200", "end": "#C2C0", "bytes": 192},
            {"id": "runtime.enemy_pool", "start": "#C2C0", "end": "#C314", "bytes": 84},
        ],
        "recommendations": [{
            "severity": "error" if status == "error" else "ok",
            "target": "runtimeRam",
            "reason": "Runtime RAM exceeds limit." if status == "error" else "Estimated runtime RAM fits below warning threshold.",
            "action": "Reduce mutable runtime RAM." if status == "error" else "No RAM recovery needed.",
        }],
    }


def write_artifacts(
    artifact_dir: Path,
    logical_budget: dict,
    storage_policy: list[dict],
    ram_budget: dict | None = None,
    world_package_summary: list[dict] | None = None,
) -> None:
    if ram_budget is None:
        ram_budget = make_ram_budget()
    if world_package_summary is None:
        world_package_summary = [{
            "worldId": "world_test",
            "assetCount": 1,
            "screenCount": 1,
            "estimatedBytes": 0,
            "estimated8kBanks": 1,
            "bankClassBytes": [],
        }]
        for policy in storage_policy:
            if policy.get("decision") == "INHERIT_OWNER_SCREEN_POLICY":
                continue
            policy["ownerWorldIds"] = ["world_test"]
            stored_bytes = int(policy.get("storedBytesEstimate") or 0)
            world_package_summary[0]["estimatedBytes"] += stored_bytes
            world_package_summary[0]["bankClassBytes"].append({"id": "world.screen", "usedBytes": stored_bytes})
    project_slice = {
        "scope": "msx2_screen4_project_slice",
        "entryPoints": {"worldIds": [item["worldId"] for item in world_package_summary]},
        "includedRuntimeModules": ["runtime.msx2.boot", "runtime.msx2.screen4.vdp"],
        "includedRuntimeModuleDetails": [
            {
                "id": "runtime.msx2.boot",
                "placement": "resident",
                "reason": "Required by every native MSX2 SCREEN 4 build",
            },
            {
                "id": "runtime.msx2.screen4.vdp",
                "placement": "resident",
                "reason": "Required by every native MSX2 SCREEN 4 build",
            },
        ],
        "excludedRuntimeModules": [
            {
                "id": "runtime.msx2.world_special_code",
                "placement": "world_specific",
                "reason": "No world-specific behavior module is referenced by this fixture",
            },
            {
                "id": "runtime.msx2.optional_far_code",
                "placement": "far_code",
                "reason": "No optional far-code runtime is referenced by this fixture",
            },
        ],
        "worldPackageSummary": world_package_summary,
        "assetStoragePolicy": storage_policy,
        "logicalBankBudget": logical_budget,
        "ramBudget": ram_budget,
    }
    artifact_dir.mkdir(parents=True, exist_ok=True)
    (artifact_dir / "project_slice.json").write_text(json.dumps(project_slice, indent=2) + "\n", encoding="utf-8")
    (artifact_dir / "asset_storage_policy.json").write_text(json.dumps(storage_policy, indent=2) + "\n", encoding="utf-8")
    (artifact_dir / "logical_bank_budget.json").write_text(json.dumps(logical_budget, indent=2) + "\n", encoding="utf-8")
    (artifact_dir / "ram_budget.json").write_text(json.dumps(ram_budget, indent=2) + "\n", encoding="utf-8")


def make_budget(package_bytes: int, over_budget: bool = False) -> dict:
    package = {
        "id": "msx2screen.test_room",
        "type": "msx2screen",
        "sourceId": "test_room",
        "recommendedBankClass": "world.screen",
        "usedBytes": package_bytes,
        "freeBytesIfAlone": max(0, 8192 - package_bytes),
        "warning": package_bytes >= 7372,
        "overBudgetBytes": max(0, package_bytes - 8192),
        "canSplit": True,
    }
    packed_bank = {
        "bankIndex": 0,
        "usedBytes": min(package_bytes, 8192),
        "freeBytes": max(0, 8192 - package_bytes),
        "warning": package_bytes >= 7372,
        "overBudgetBytes": max(0, package_bytes - 8192),
        "packages": [{"id": package["id"], "usedBytes": package_bytes, "recommendedBankClass": "world.screen"}],
    }
    recommendations = [{
        "severity": "error" if over_budget else "ok",
        "target": package["id"] if over_budget else "logicalBankBudget",
        "reason": "Package exceeds one 8 KB bank." if over_budget else "All estimated packages fit below warning threshold.",
        "action": "Split this logical package." if over_budget else "No recovery needed before the final allocator pass.",
    }]
    bank_class_summary = [{
        "id": "world.screen",
        "packageCount": 1,
        "usedBytes": package_bytes,
        "estimatedMinimumBanks": 1 if package_bytes <= 8192 else 2,
        "warningPackageCount": 1 if package["warning"] else 0,
        "overBudgetPackageCount": 1 if package["overBudgetBytes"] else 0,
        "largestPackage": {"id": package["id"], "usedBytes": package_bytes},
    }]
    recovery_plan = [
        {"order": 1, "id": "repack_final_sizes", "status": "recommended" if package["warning"] else "not_needed", "trigger": "bank pressure", "appliesTo": ["bank0"] if package["warning"] else [], "action": "Re-run first-fit-decreasing with final stored sizes."},
        {"order": 2, "id": "split_world_packages", "status": "required" if over_budget else "not_needed", "trigger": "large splittable package", "appliesTo": [package["id"]] if over_budget else [], "action": "Split the logical world package across additional physical world data banks."},
        {"order": 3, "id": "move_cold_readonly_data", "status": "not_needed", "trigger": "resident pressure", "appliesTo": [], "action": "Move cold read-only tables to world data banks."},
        {"order": 4, "id": "selective_zx0", "status": "recommended" if package["warning"] else "not_needed", "trigger": "large load-to-VRAM data", "appliesTo": [package["id"]] if package["warning"] else [], "action": "Try ZX0 only for large load-to-VRAM resources."},
        {"order": 5, "id": "keep_hot_runtime_raw", "status": "enforced", "trigger": "hot runtime table", "appliesTo": ["runtime lookup tables"], "action": "Keep hot per-frame tables raw."},
        {"order": 6, "id": "world_special_code_bank", "status": "not_needed", "trigger": "rare behavior pressure", "appliesTo": [], "action": "Move rare behavior behind a world special-code bank."},
        {"order": 7, "id": "split_large_payload_chunks", "status": "required" if over_budget else "not_needed", "trigger": "single payload cannot fit one mapper window", "appliesTo": [package["id"]] if over_budget else [], "action": "Split large payloads into loader-addressable chunks."},
        {"order": 8, "id": "fail_actionable_report", "status": "required" if over_budget else "ready", "trigger": "recovery still leaves over-budget unit", "appliesTo": [package["id"]] if over_budget else [], "action": "Fail before Glass with largest contributors."},
    ]
    return {
        "bankSizeBytes": 8192,
        "warningThresholdBytes": 7372,
        "totalPayloadBytes": package_bytes,
        "estimatedMinimumBanks": 1 if package_bytes <= 8192 else 2,
        "estimatedPackedBankCount": 1,
        "estimatedPackedBanks": [packed_bank],
        "overBudgetPackages": [package] if over_budget else [],
        "warningPackages": [package] if package["warning"] else [],
        "warningPackedBanks": [packed_bank] if packed_bank["warning"] else [],
        "bankClassSummary": bank_class_summary,
        "recoveryRecommendations": recommendations,
        "recoveryPlan": recovery_plan,
        "packages": [package],
    }


def expect_failure(artifact_dir: Path, expected_text: str, strict_warnings: bool = False) -> None:
    try:
        validate_msx2_screen4_megarom_preflight_budget(artifact_dir, strict_warnings=strict_warnings)
    except RuntimeError as exc:
        if expected_text not in str(exc):
            raise AssertionError(f"Expected {expected_text!r} in preflight error, got: {exc}") from exc
        return
    raise AssertionError("Expected MSX2 MegaROM preflight to fail")


def main() -> None:
    storage_policy = [{
        "type": "msx2screen",
        "id": "test_room",
        "name": "Test Room",
        "rawBytes": 4096,
        "storedBytesEstimate": 4096,
        "accessPattern": "mixed_load_to_vram_and_runtime_read",
        "mutable": False,
        "decision": "MIXED_ROM_RAW_TO_VRAM_AND_ROM_RAW",
    }]

    with tempfile.TemporaryDirectory(prefix="mideas_msx2_preflight_") as tmp:
        root = Path(tmp)

        ok_dir = root / "ok_generated"
        write_artifacts(ok_dir, make_budget(4096), storage_policy)
        output = StringIO()
        with redirect_stdout(output):
            validate_msx2_screen4_megarom_preflight_budget(ok_dir)
        summary = output.getvalue()
        if "MSX2 MegaROM preflight:" not in summary or "payload=4096 bytes" not in summary:
            raise AssertionError(f"Preflight summary was not printed as expected: {summary!r}")
        if "MSX2 MegaROM preflight classes:" not in summary or "world.screen=4096 bytes/1 pkg" not in summary:
            raise AssertionError(f"Preflight class summary was not printed as expected: {summary!r}")
        if "MSX2 MegaROM preflight worlds:" not in summary or "world_test=4096 bytes/1 screens" not in summary:
            raise AssertionError(f"Preflight world summary was not printed as expected: {summary!r}")
        if "MSX2 RAM preflight:" not in summary or "free=12000 bytes" not in summary:
            raise AssertionError(f"RAM preflight summary was not printed as expected: {summary!r}")
        preflight_summary_path = ok_dir / "preflight_summary.json"
        if not preflight_summary_path.exists():
            raise AssertionError("preflight_summary.json was not written for a passing MSX2 preflight")
        preflight_summary = json.loads(preflight_summary_path.read_text(encoding="utf-8"))
        if preflight_summary.get("scope") != "msx2_screen4_megarom_preflight_summary":
            raise AssertionError(f"Unexpected preflight summary scope: {preflight_summary.get('scope')!r}")
        if preflight_summary.get("status") != "ok":
            raise AssertionError(f"Unexpected preflight summary status: {preflight_summary.get('status')!r}")
        if preflight_summary.get("rom", {}).get("payloadBytes") != 4096:
            raise AssertionError(f"Unexpected ROM payload summary: {preflight_summary.get('rom')!r}")
        if preflight_summary.get("rom", {}).get("bankClassSummary") != make_budget(4096)["bankClassSummary"]:
            raise AssertionError(f"Unexpected bank class summary: {preflight_summary.get('rom')!r}")
        if preflight_summary.get("worldPackages", [{}])[0].get("estimatedBytes") != 4096:
            raise AssertionError(f"Unexpected world package summary: {preflight_summary.get('worldPackages')!r}")
        if preflight_summary.get("planB", {}).get("recoveryPlan") != make_budget(4096)["recoveryPlan"]:
            raise AssertionError(f"Unexpected recovery plan: {preflight_summary.get('planB')!r}")
        artifact_checks = preflight_summary.get("artifactChecks")
        if not isinstance(artifact_checks, list) or len(artifact_checks) != 4:
            raise AssertionError(f"Unexpected artifact checks: {artifact_checks!r}")
        artifact_names = {item.get("name") for item in artifact_checks if isinstance(item, dict)}
        if artifact_names != {"project_slice.json", "asset_storage_policy.json", "logical_bank_budget.json", "ram_budget.json"}:
            raise AssertionError(f"Unexpected artifact check names: {artifact_checks!r}")
        for artifact_check in artifact_checks:
            if not isinstance(artifact_check, dict) or int(artifact_check.get("bytes") or 0) <= 0:
                raise AssertionError(f"Invalid artifact check byte count: {artifact_check!r}")
            if not str(artifact_check.get("checksum") or "").startswith("fnv1a32:"):
                raise AssertionError(f"Invalid artifact check checksum: {artifact_check!r}")
        expected_artifact_checks = build_preflight_artifact_summaries([
            ("project_slice.json", ok_dir / "project_slice.json"),
            ("asset_storage_policy.json", ok_dir / "asset_storage_policy.json"),
            ("logical_bank_budget.json", ok_dir / "logical_bank_budget.json"),
            ("ram_budget.json", ok_dir / "ram_budget.json"),
        ])
        if artifact_checks != expected_artifact_checks:
            raise AssertionError(
                "Preflight input artifact checks do not match the generated files: "
                f"{artifact_checks!r} != {expected_artifact_checks!r}"
            )
        output_artifact_checks = preflight_summary.get("outputArtifactChecks")
        if not isinstance(output_artifact_checks, list) or len(output_artifact_checks) != 1:
            raise AssertionError(f"Unexpected preflight output artifact checks: {output_artifact_checks!r}")
        ide_output_check = output_artifact_checks[0]
        if ide_output_check.get("name") != "msx2_ide_budget_feedback.json":
            raise AssertionError(f"Unexpected preflight output artifact check: {ide_output_check!r}")
        if int(ide_output_check.get("bytes") or 0) <= 0:
            raise AssertionError(f"Invalid IDE output artifact byte count: {ide_output_check!r}")
        if not str(ide_output_check.get("checksum") or "").startswith("fnv1a32:"):
            raise AssertionError(f"Invalid IDE output artifact checksum: {ide_output_check!r}")
        expected_ide_output_check = build_preflight_artifact_summaries([
            ("msx2_ide_budget_feedback.json", ok_dir / "msx2_ide_budget_feedback.json")
        ])[0]
        if ide_output_check != expected_ide_output_check:
            raise AssertionError(
                "Preflight IDE output artifact check does not match the generated file: "
                f"{ide_output_check!r} != {expected_ide_output_check!r}"
            )
        pipeline_gates = preflight_summary.get("pipelineGates")
        if not isinstance(pipeline_gates, list) or len(pipeline_gates) != 11:
            raise AssertionError(f"Unexpected pipeline gate summary: {pipeline_gates!r}")
        expected_gate_ids = [
            "project_analysis_and_world_package_extraction",
            "project_precompilation_slice",
            "asset_storage_policy",
            "ram_budget_report",
            "bank_allocation_dry_run",
            "overflow_recovery_plan",
            "asm_generation",
            "glass_compile",
            "artifact_validation_against_symbols",
            "post_compilation_optimization",
            "openmsx_smoke",
        ]
        actual_gate_ids = [item.get("id") for item in pipeline_gates if isinstance(item, dict)]
        if actual_gate_ids != expected_gate_ids:
            raise AssertionError(f"Unexpected pipeline gate order: {pipeline_gates!r}")
        if any(item.get("status") != "passed" for item in pipeline_gates[:6] if isinstance(item, dict)):
            raise AssertionError(f"Preflight pipeline gates should be marked passed: {pipeline_gates!r}")
        if pipeline_gates[7].get("status") != "pending":
            raise AssertionError(f"Glass gate should still be pending at preflight: {pipeline_gates!r}")
        if preflight_summary.get("ram", {}).get("freeBytes") != 12000:
            raise AssertionError(f"Unexpected RAM free summary: {preflight_summary.get('ram')!r}")
        ide_feedback_path = ok_dir / "msx2_ide_budget_feedback.json"
        if not ide_feedback_path.exists():
            raise AssertionError("msx2_ide_budget_feedback.json was not written for a passing MSX2 preflight")
        ide_feedback = json.loads(ide_feedback_path.read_text(encoding="utf-8"))
        if ide_feedback.get("scope") != "msx2_screen4_ide_budget_feedback":
            raise AssertionError(f"Unexpected IDE feedback scope: {ide_feedback.get('scope')!r}")
        if ide_feedback.get("status") != "ok":
            raise AssertionError(f"Unexpected IDE feedback status: {ide_feedback.get('status')!r}")
        if (ide_feedback.get("rom") or {}).get("bankClassSummary") != make_budget(4096)["bankClassSummary"]:
            raise AssertionError(f"IDE feedback did not expose bank class summary: {ide_feedback.get('rom')!r}")
        if (ide_feedback.get("ram") or {}).get("freeBytes") != 12000:
            raise AssertionError(f"IDE feedback did not expose RAM summary: {ide_feedback.get('ram')!r}")
        if (ide_feedback.get("worldPackages") or [{}])[0].get("estimatedBytes") != 4096:
            raise AssertionError(f"IDE feedback did not expose world package summary: {ide_feedback.get('worldPackages')!r}")
        if not (ide_feedback.get("largestAssets") or []):
            raise AssertionError(f"IDE feedback did not expose largest assets: {ide_feedback!r}")
        if not isinstance(ide_feedback.get("suggestedFixes"), list):
            raise AssertionError(f"IDE feedback did not expose suggested fixes: {ide_feedback!r}")

        rom_path = ok_dir / "test.rom"
        asm_path = ok_dir / "test.asm"
        sym_path = ok_dir / "test.sym"
        post_asm_report_path = ok_dir / "test.post-asm-report.json"
        rom_path.write_bytes(b"AB" + bytes([0xFF]) * 8190)
        asm_path.write_text("; synthetic asm\n", encoding="utf-8")
        sym_path.write_text("START: 4000\n", encoding="utf-8")
        post_asm_report_path.write_text(
            json.dumps({
                "input": str(asm_path),
                "metrics": {
                    "block_inventory": {
                        "dead_block_candidates": 2,
                        "dead_candidate_lines": 12,
                        "dead_candidate_source_bytes": 384,
                    },
                    "optimization_summary": {
                        "passes_run": 1,
                        "removed_lines": 4,
                        "removed_source_bytes": 128,
                    },
                },
                "findings": [{"rule_id": "unit"}],
                "applied_patches": 1,
            }),
            encoding="utf-8",
        )
        write_msx2_build_summary(
            artifact_dir=ok_dir,
            rom_output=rom_path,
            asm_to_compile=asm_path,
            sym_output=sym_path,
            original_size=8192,
            padded_size=8192,
            validation_kind="unit_test",
            post_asm_requested=True,
            post_asm_check_only=True,
            post_asm_applied=False,
            post_asm_report_paths=[post_asm_report_path],
            openmsx_requested=True,
            openmsx_passed=True,
        )
        build_summary_path = ok_dir / "msx2_build_summary.json"
        if not build_summary_path.exists():
            raise AssertionError("msx2_build_summary.json was not written")
        build_summary = json.loads(build_summary_path.read_text(encoding="utf-8"))
        if build_summary.get("scope") != "msx2_screen4_megarom_build_summary":
            raise AssertionError(f"Unexpected build summary scope: {build_summary.get('scope')!r}")
        if build_summary.get("preflightArtifactChecks") != artifact_checks:
            raise AssertionError("Build summary did not preserve preflight artifact checks")
        if build_summary.get("preflightOutputArtifactChecks") != preflight_summary.get("outputArtifactChecks"):
            raise AssertionError("Build summary did not preserve preflight output artifact checks")
        build_gate_by_id = {
            item.get("id"): item
            for item in build_summary.get("pipelineGates", [])
            if isinstance(item, dict)
        }
        if build_gate_by_id.get("glass_compile", {}).get("status") != "passed":
            raise AssertionError(f"Build summary did not mark Glass as passed: {build_summary.get('pipelineGates')!r}")
        if build_gate_by_id.get("artifact_validation_against_symbols", {}).get("status") != "passed":
            raise AssertionError(f"Build summary did not mark symbol validation as passed: {build_summary.get('pipelineGates')!r}")
        if build_gate_by_id.get("post_compilation_optimization", {}).get("status") != "check_only_passed":
            raise AssertionError(f"Build summary did not mark Post-ASM check-only status: {build_summary.get('pipelineGates')!r}")
        if build_gate_by_id.get("openmsx_smoke", {}).get("status") != "passed":
            raise AssertionError(f"Build summary did not mark OpenMSX as passed: {build_summary.get('pipelineGates')!r}")
        validation = build_summary.get("validation") or {}
        if validation.get("postAsm") != "check_only_passed" or validation.get("openmsx") != "passed":
            raise AssertionError(f"Build summary validation statuses are wrong: {validation!r}")
        ide_budget_feedback_summary = build_summary.get("ideBudgetFeedback")
        if not isinstance(ide_budget_feedback_summary, dict):
            raise AssertionError(f"Build summary did not include IDE budget feedback summary: {build_summary!r}")
        if ide_budget_feedback_summary.get("status") != "ok":
            raise AssertionError(f"Build summary IDE feedback status is invalid: {ide_budget_feedback_summary!r}")
        if not str(ide_budget_feedback_summary.get("checksum") or "").startswith("fnv1a32:"):
            raise AssertionError(f"Build summary IDE feedback checksum is invalid: {ide_budget_feedback_summary!r}")
        if ide_budget_feedback_summary.get("bytes") != ide_output_check.get("bytes"):
            raise AssertionError(f"Build summary IDE feedback byte count drifted: {ide_budget_feedback_summary!r}")
        if ide_budget_feedback_summary.get("checksum") != ide_output_check.get("checksum"):
            raise AssertionError(f"Build summary IDE feedback checksum drifted: {ide_budget_feedback_summary!r}")
        post_asm_reports = build_summary.get("postAsmReports")
        if not isinstance(post_asm_reports, list) or len(post_asm_reports) != 1:
            raise AssertionError(f"Build summary did not include Post-ASM report summaries: {post_asm_reports!r}")
        post_asm_report = post_asm_reports[0]
        if (
            post_asm_report.get("findings") != 1
            or post_asm_report.get("appliedPatches") != 1
            or post_asm_report.get("deadCandidateSourceBytes") != 384
            or post_asm_report.get("removedSourceBytes") != 128
        ):
            raise AssertionError(f"Build summary Post-ASM report summary is invalid: {post_asm_report!r}")
        for summary_key in ("rom", "asm", "sym"):
            checksum = ((build_summary.get(summary_key) or {}).get("checksum"))
            if not str(checksum or "").startswith("fnv1a32:"):
                raise AssertionError(f"Build summary {summary_key} checksum is invalid: {build_summary.get(summary_key)!r}")

        over_dir = root / "over_generated"
        write_artifacts(over_dir, make_budget(9000, over_budget=True), storage_policy)
        (over_dir / "preflight_summary.json").write_text('{"status":"stale"}\n', encoding="utf-8")
        (over_dir / "msx2_ide_budget_feedback.json").write_text('{"status":"stale"}\n', encoding="utf-8")
        (over_dir / "msx2_build_summary.json").write_text('{"status":"stale"}\n', encoding="utf-8")
        (over_dir / "msx2_preflight_failure.json").write_text('{"status":"stale"}\n', encoding="utf-8")
        expect_failure(over_dir, "failed before Glass")
        if (over_dir / "preflight_summary.json").exists():
            raise AssertionError("Failed preflight left a stale preflight_summary.json behind")
        if (over_dir / "msx2_ide_budget_feedback.json").exists():
            raise AssertionError("Failed preflight left a stale msx2_ide_budget_feedback.json behind")
        if (over_dir / "msx2_build_summary.json").exists():
            raise AssertionError("Failed preflight left a stale msx2_build_summary.json behind")
        over_failure_path = over_dir / "msx2_preflight_failure.json"
        if not over_failure_path.exists():
            raise AssertionError("Failed preflight did not write msx2_preflight_failure.json")
        over_failure = json.loads(over_failure_path.read_text(encoding="utf-8"))
        if over_failure.get("scope") != "msx2_screen4_megarom_preflight_failure":
            raise AssertionError(f"Unexpected failure summary scope: {over_failure!r}")
        if over_failure.get("reason") != "logical_package_over_budget":
            raise AssertionError(f"Unexpected over-budget failure reason: {over_failure!r}")
        if not (over_failure.get("rom") or {}).get("overBudgetPackages"):
            raise AssertionError(f"Failure summary did not include overBudgetPackages: {over_failure!r}")
        if not (over_failure.get("planB") or {}).get("recoveryPlan"):
            raise AssertionError(f"Failure summary did not include recoveryPlan: {over_failure!r}")

        warning_dir = root / "warning_generated"
        write_artifacts(warning_dir, make_budget(7600), storage_policy)
        output = StringIO()
        with redirect_stdout(output):
            validate_msx2_screen4_megarom_preflight_budget(warning_dir)
        if "preflight warning" not in output.getvalue():
            raise AssertionError("Expected non-strict preflight to report a warning")
        warning_feedback_path = warning_dir / "msx2_ide_budget_feedback.json"
        if not warning_feedback_path.exists():
            raise AssertionError("Warning preflight did not write msx2_ide_budget_feedback.json")
        warning_feedback = json.loads(warning_feedback_path.read_text(encoding="utf-8"))
        if warning_feedback.get("status") != "warning":
            raise AssertionError(f"Warning preflight did not mark IDE feedback as warning: {warning_feedback!r}")
        if not (warning_feedback.get("warnings") or {}).get("warningPackedBanks"):
            raise AssertionError(f"Warning IDE feedback did not expose warningPackedBanks: {warning_feedback!r}")
        if not any(
            item.get("severity") == "recommended"
            for item in (warning_feedback.get("suggestedFixes") or [])
            if isinstance(item, dict)
        ):
            raise AssertionError(f"Warning IDE feedback did not expose recommended Plan B fixes: {warning_feedback!r}")
        (warning_dir / "msx2_build_summary.json").write_text('{"status":"stale"}\n', encoding="utf-8")
        (warning_dir / "msx2_preflight_failure.json").write_text('{"status":"stale"}\n', encoding="utf-8")
        expect_failure(warning_dir, "strict warning gate rejected", strict_warnings=True)
        if (warning_dir / "preflight_summary.json").exists():
            raise AssertionError("Strict warning preflight left a stale preflight_summary.json behind")
        if (warning_dir / "msx2_ide_budget_feedback.json").exists():
            raise AssertionError("Strict warning preflight left a stale msx2_ide_budget_feedback.json behind")
        if (warning_dir / "msx2_build_summary.json").exists():
            raise AssertionError("Strict warning preflight left a stale msx2_build_summary.json behind")
        warning_failure_path = warning_dir / "msx2_preflight_failure.json"
        if not warning_failure_path.exists():
            raise AssertionError("Strict warning preflight did not write msx2_preflight_failure.json")
        warning_failure = json.loads(warning_failure_path.read_text(encoding="utf-8"))
        if warning_failure.get("reason") != "strict_warning_gate_rejected":
            raise AssertionError(f"Unexpected strict warning failure reason: {warning_failure!r}")
        if not (warning_failure.get("details") or {}).get("warningBanks"):
            raise AssertionError(f"Strict warning failure did not expose warningBanks: {warning_failure!r}")

        auto_warning_dir = root / "auto_warning_generated"
        write_artifacts(auto_warning_dir, make_budget(7600), storage_policy)
        auto_warning_asm = root / "auto_warning.asm"
        auto_warning_asm.write_text("; synthetic asm\n", encoding="utf-8")
        resolved_dir, resolved_asm = validate_msx2_preflight_with_safe_resolution(
            artifact_dir=auto_warning_dir,
            asm_output=auto_warning_asm,
            project_root=root,
            strict_warnings=True,
            auto_resolve=True,
            skip_zx0_preprocess=False,
            max_attempts=1,
        )
        if resolved_dir != auto_warning_dir or resolved_asm != auto_warning_asm:
            raise AssertionError("Strict warning auto-resolve should keep the same artifact dir and ASM path")
        resolution_path = auto_warning_dir / "msx2_budget_resolution.json"
        if not resolution_path.exists():
            raise AssertionError("Strict warning auto-resolve did not write msx2_budget_resolution.json")
        resolution = json.loads(resolution_path.read_text(encoding="utf-8"))
        if resolution.get("scope") != "msx2_screen4_budget_resolution" or resolution.get("status") != "resolved":
            raise AssertionError(f"Unexpected strict warning resolution summary: {resolution!r}")
        if not any(item.get("action") == "relax_strict_warning_gate" for item in resolution.get("attempts", []) if isinstance(item, dict)):
            raise AssertionError(f"Strict warning resolution did not record relaxed gate attempt: {resolution!r}")
        auto_rom_path = auto_warning_dir / "auto_warning.rom"
        auto_sym_path = auto_warning_dir / "auto_warning.sym"
        auto_rom_path.write_bytes(b"CD" + bytes([0xFF]) * 8190)
        auto_sym_path.write_text("START: 4000\n", encoding="utf-8")
        write_msx2_build_summary(
            artifact_dir=auto_warning_dir,
            rom_output=auto_rom_path,
            asm_to_compile=auto_warning_asm,
            sym_output=auto_sym_path,
            original_size=8192,
            padded_size=8192,
            validation_kind="unit_test_auto_resolved",
        )
        auto_build_summary_path = auto_warning_dir / "msx2_build_summary.json"
        auto_build_summary = json.loads(auto_build_summary_path.read_text(encoding="utf-8"))
        budget_resolution = auto_build_summary.get("budgetResolution")
        if not isinstance(budget_resolution, dict):
            raise AssertionError(f"Build summary did not include budget resolution summary: {auto_build_summary!r}")
        if budget_resolution.get("status") != "resolved" or budget_resolution.get("finalAction") != "relax_strict_warning_gate":
            raise AssertionError(f"Build summary budget resolution is invalid: {budget_resolution!r}")
        if budget_resolution.get("attempts") != len(resolution.get("attempts") or []):
            raise AssertionError(f"Build summary budget resolution attempt count drifted: {budget_resolution!r}")
        if not str(budget_resolution.get("checksum") or "").startswith("fnv1a32:"):
            raise AssertionError(f"Build summary budget resolution checksum is invalid: {budget_resolution!r}")

        ram_over_dir = root / "ram_over_generated"
        write_artifacts(ram_over_dir, make_budget(4096), storage_policy, make_ram_budget(status="error", free_bytes=-1))
        expect_failure(ram_over_dir, "runtime RAM exceeds limit")

        ram_sections_dir = root / "ram_sections_generated"
        ram_without_sections = make_ram_budget()
        ram_without_sections["sections"] = []
        write_artifacts(ram_sections_dir, make_budget(4096), storage_policy, ram_without_sections)
        expect_failure(ram_sections_dir, "ramBudget has no runtime sections")

        mismatch_dir = root / "mismatch_generated"
        write_artifacts(mismatch_dir, make_budget(4096), storage_policy)
        (mismatch_dir / "asset_storage_policy.json").write_text("[]\n", encoding="utf-8")
        expect_failure(mismatch_dir, "asset_storage_policy.json differs")

        ram_mismatch_dir = root / "ram_mismatch_generated"
        write_artifacts(ram_mismatch_dir, make_budget(4096), storage_policy)
        (ram_mismatch_dir / "ram_budget.json").write_text("{}\n", encoding="utf-8")
        expect_failure(ram_mismatch_dir, "ram_budget.json differs")

        empty_budget_dir = root / "empty_budget_generated"
        write_artifacts(empty_budget_dir, make_budget(4096), storage_policy)
        (empty_budget_dir / "logical_bank_budget.json").write_text("", encoding="utf-8")
        expect_failure(empty_budget_dir, "logical_bank_budget.json is empty")

        corrupt_budget_dir = root / "corrupt_budget_generated"
        write_artifacts(corrupt_budget_dir, make_budget(4096), storage_policy)
        (corrupt_budget_dir / "logical_bank_budget.json").write_text("{not json}\n", encoding="utf-8")
        expect_failure(corrupt_budget_dir, "logical_bank_budget.json is not valid JSON")

        class_mismatch_dir = root / "class_mismatch_generated"
        bad_class_budget = make_budget(4096)
        bad_class_budget["bankClassSummary"][0]["usedBytes"] = 2048
        write_artifacts(class_mismatch_dir, bad_class_budget, storage_policy)
        expect_failure(class_mismatch_dir, "bankClassSummary total")

        recovery_plan_mismatch_dir = root / "recovery_plan_mismatch_generated"
        bad_recovery_budget = make_budget(4096)
        bad_recovery_budget["recoveryPlan"][0]["id"] = "wrong_step"
        write_artifacts(recovery_plan_mismatch_dir, bad_recovery_budget, storage_policy)
        expect_failure(recovery_plan_mismatch_dir, "recoveryPlan order")

        world_mismatch_dir = root / "world_mismatch_generated"
        bad_world_summary = [{
            "worldId": "world_test",
            "assetCount": 1,
            "screenCount": 1,
            "estimatedBytes": 2048,
            "estimated8kBanks": 1,
            "bankClassBytes": [{"id": "world.screen", "usedBytes": 2048}],
        }]
        write_artifacts(world_mismatch_dir, make_budget(4096), storage_policy, world_package_summary=bad_world_summary)
        expect_failure(world_mismatch_dir, "worldPackageSummary estimatedBytes")

        overflow_asm = root / "resident_overflow.asm"
        overflow_asm.write_text(
            "\n".join([
                "    org #4000",
                "; MSX2 SCREEN 4 cold data bank.",
                "    ds #C000 - $, #FF",
            ]) + "\n",
            encoding="utf-8",
        )
        diagnostic = describe_glass_compile_failure("", "Negative initial size: -213", overflow_asm)
        if not diagnostic or "MSX2 MegaROM resident bank overflow" not in diagnostic or "#C000 padding" not in diagnostic:
            raise AssertionError(f"Unexpected Glass resident overflow diagnostic: {diagnostic}")
        generic_diagnostic = describe_glass_compile_failure("", "Negative initial size: -12", root / "missing.asm")
        if not generic_diagnostic or "MegaROM bank padding overflow" not in generic_diagnostic:
            raise AssertionError(f"Unexpected generic Glass overflow diagnostic: {generic_diagnostic}")
        compile_failure_dir = root / "compile_failure_generated"
        write_artifacts(compile_failure_dir, make_budget(4096), storage_policy)
        validate_msx2_screen4_megarom_preflight_budget(compile_failure_dir)
        compile_failure_path = write_msx2_compile_failure_summary(
            compile_failure_dir,
            overflow_asm,
            root / "failed.rom",
            root / "failed.sym",
            diagnostic,
        )
        if compile_failure_path is None or not compile_failure_path.exists():
            raise AssertionError("Expected msx2_compile_failure.json to be written")
        compile_failure = json.loads(compile_failure_path.read_text(encoding="utf-8"))
        if compile_failure.get("scope") != "msx2_screen4_megarom_compile_failure":
            raise AssertionError(f"Unexpected compile failure scope: {compile_failure}")
        glass_gate = next((gate for gate in compile_failure.get("pipelineGates", []) if gate.get("id") == "glass_compile"), None)
        if not glass_gate or glass_gate.get("status") != "failed":
            raise AssertionError(f"Compile failure did not mark glass_compile failed: {compile_failure}")
        if "Move cold read-only tables" not in (compile_failure.get("planB") or {}).get("primary", ""):
            raise AssertionError(f"Compile failure did not include Plan B guidance: {compile_failure}")

    print("MSX2 MegaROM preflight budget checks passed.")


if __name__ == "__main__":
    main()
