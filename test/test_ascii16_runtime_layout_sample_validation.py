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


def expect_rejects(builder, sample: dict, expected_fragment: str) -> None:
    try:
        builder._require_runtime_layout_sample_fields(
            [sample],
            "estimated resident out-of-window call",
            ("callerBank", "line", "targetBank", "targetEstimatedOffset", "targetEstimatedAddress", "targetEstimatedSegment"),
            ("callerModule", "target", "targetModule"),
        )
    except RuntimeError as exc:
        if expected_fragment not in str(exc):
            raise AssertionError(f"Unexpected validation error: {exc}") from exc
    else:
        raise AssertionError("Malformed ASCII16 runtime-layout sample should be rejected")


def main() -> int:
    builder = load_builder_module()
    valid_call_sample = {
        "callerBank": 5,
        "callerModule": "components.asm",
        "line": 42,
        "target": "update_input_component",
        "targetBank": 1,
        "targetModule": "components.asm",
        "targetEstimatedOffset": 16640,
        "targetEstimatedAddress": 0xA100,
        "targetEstimatedSegment": 1,
    }

    builder._require_runtime_layout_sample_fields(
        [valid_call_sample],
        "estimated resident out-of-window call",
        ("callerBank", "line", "targetBank", "targetEstimatedOffset", "targetEstimatedAddress", "targetEstimatedSegment"),
        ("callerModule", "target", "targetModule"),
    )

    missing_target = dict(valid_call_sample)
    missing_target["target"] = ""
    expect_rejects(builder, missing_target, "samples need target")

    missing_address = dict(valid_call_sample)
    del missing_address["targetEstimatedAddress"]
    expect_rejects(builder, missing_address, "samples need numeric targetEstimatedAddress")

    print("ASCII16 runtime-layout sample validation tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
