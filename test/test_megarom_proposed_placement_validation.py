#!/usr/bin/env python3
import importlib.util
import sys
from pathlib import Path


def load_builder_module():
    sys.dont_write_bytecode = True
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "build_mideas_unified_rom.py"
    spec = importlib.util.spec_from_file_location("build_mideas_unified_rom", script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot import {script_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def expect_rejects(builder, placement: object, expected_fragment: str) -> None:
    try:
        builder._validate_proposed_resource_placement(
            placement,
            {7: 96},
            8192,
            0x8000,
            expected_bank=4,
        )
    except RuntimeError as exc:
        if expected_fragment not in str(exc):
            raise AssertionError(f"Unexpected validation error: {exc}") from exc
    else:
        raise AssertionError("Malformed proposedPlacement resource placement should be rejected")


def main() -> int:
    builder = load_builder_module()
    valid_placement = {
        "id": 7,
        "label": "SCREEN_0_PATTERNS",
        "bank": 4,
        "zoneOffset": 0x120,
        "windowAddress": 0x8120,
        "storedSize": 96,
        "placementReason": "scene-aware first-fit unit; proposedBank=4; offset=#0120",
    }

    resource_id = builder._validate_proposed_resource_placement(
        valid_placement,
        {7: 96},
        8192,
        0x8000,
        expected_bank=4,
    )
    assert resource_id == 7

    bad_window = dict(valid_placement)
    bad_window["windowAddress"] = 0xA120
    expect_rejects(builder, bad_window, "windowAddress mismatch")

    missing_reason = dict(valid_placement)
    missing_reason["placementReason"] = ""
    expect_rejects(builder, missing_reason, "need placementReason")

    crossing_zone = dict(valid_placement)
    crossing_zone["zoneOffset"] = 8192 - 32
    expect_rejects(builder, crossing_zone, "cross mapper data segment")

    wrong_bank = dict(valid_placement)
    wrong_bank["bank"] = 5
    expect_rejects(builder, wrong_bank, "bank mismatch")

    bank_signature = builder._proposed_resource_placement_signature(valid_placement)
    stale_top_level = dict(valid_placement)
    stale_top_level["bank"] = 5
    stale_signature = builder._proposed_resource_placement_signature(stale_top_level)
    try:
        builder._require_matching_proposed_resource_placements({7: bank_signature}, {7: stale_signature})
    except RuntimeError as exc:
        assert "top-level resourcePlacements mismatch" in str(exc)
    else:
        raise AssertionError("Stale aggregate proposedPlacement metadata should be rejected")

    print("MegaROM proposed placement validation tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
