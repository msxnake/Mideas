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

from build_mideas_unified_rom import validate_msx2_screen4_megarom_preflight_budget


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
) -> None:
    if ram_budget is None:
        ram_budget = make_ram_budget()
    project_slice = {
        "scope": "msx2_screen4_project_slice",
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
        "recoveryRecommendations": recommendations,
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
        if preflight_summary.get("ram", {}).get("freeBytes") != 12000:
            raise AssertionError(f"Unexpected RAM free summary: {preflight_summary.get('ram')!r}")

        over_dir = root / "over_generated"
        write_artifacts(over_dir, make_budget(9000, over_budget=True), storage_policy)
        (over_dir / "preflight_summary.json").write_text('{"status":"stale"}\n', encoding="utf-8")
        expect_failure(over_dir, "failed before Glass")
        if (over_dir / "preflight_summary.json").exists():
            raise AssertionError("Failed preflight left a stale preflight_summary.json behind")

        warning_dir = root / "warning_generated"
        write_artifacts(warning_dir, make_budget(7600), storage_policy)
        output = StringIO()
        with redirect_stdout(output):
            validate_msx2_screen4_megarom_preflight_budget(warning_dir)
        if "preflight warning" not in output.getvalue():
            raise AssertionError("Expected non-strict preflight to report a warning")
        expect_failure(warning_dir, "strict warning gate rejected", strict_warnings=True)
        if (warning_dir / "preflight_summary.json").exists():
            raise AssertionError("Strict warning preflight left a stale preflight_summary.json behind")

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

    print("MSX2 MegaROM preflight budget checks passed.")


if __name__ == "__main__":
    main()
