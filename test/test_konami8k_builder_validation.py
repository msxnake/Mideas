#!/usr/bin/env python3
from pathlib import Path
import json
import importlib.util
import sys
import tempfile


def load_builder_module():
    sys.dont_write_bytecode = True
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "build_mideas_unified_rom.py"
    spec = importlib.util.spec_from_file_location("build_mideas_unified_rom", script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot import {script_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


VALID_ASM = """
MAPPER_REG_P1       EQU #6000
MAPPER_REG_P2       EQU #8000
MAPPER_REG_P3       EQU #A000
mapper_runtime_init:
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    call mapper_set_bank_p3

RESOURCE_TABLE_ENTRY_SIZE EQU 5
RESOURCE_TABLE_COUNT EQU 2
resource_table:
    db 4
    dw #A000
    dw 32
    db 5
    dw #BFFF
    dw 1

; DATA BANKS
; Accessed through mapper P3 using
; (label & #1FFF) | #A000.
"""


def write_case(tmpdir: Path, asm_text: str, rom_size: int = 65536) -> tuple[Path, Path]:
    rom = tmpdir / "case.rom"
    asm = tmpdir / "case.asm"
    rom.write_bytes(b"AB" + bytes([0xFF]) * (rom_size - 2))
    asm.write_text(asm_text, encoding="utf-8")
    return rom, asm


def expect_failure(builder, rom: Path, asm: Path, expected: str) -> None:
    try:
        builder.validate_konami8k_megarom(rom, asm)
    except RuntimeError as exc:
        if expected not in str(exc):
            raise AssertionError(f"Expected error containing {expected!r}, got {exc!r}") from exc
        return
    raise AssertionError(f"Expected validation failure containing {expected!r}")


def expect_artifact_failure(builder, artifact_dir: Path, expected: str) -> None:
    try:
        builder.validate_konami8k_generated_artifacts(artifact_dir)
    except RuntimeError as exc:
        if expected not in str(exc):
            raise AssertionError(f"Expected error containing {expected!r}, got {exc!r}") from exc
        return
    raise AssertionError(f"Expected artifact validation failure containing {expected!r}")


def write_valid_artifacts(
    artifact_dir: Path,
    address: int = 0xA000,
    size: int = 32,
    bank_number: int = 4,
    resource_count: int = 1,
) -> None:
    artifact_dir.mkdir(parents=True, exist_ok=True)
    offset = address - 0xA000
    origin = 0x4000 + (bank_number * 8192)
    manifest = {
        "version": 1,
        "mapper": {
            "dataWindowPage": "p3",
            "windowBase": "#A000",
            "windowMask": "#1FFF",
            "bankDivisor": "#2000",
            "zoneSize": 8192,
        },
        "summary": {
            "resourceCount": resource_count,
            "zoneCount": 1,
            "overflowCount": 0,
        },
        "banks": [
            {
                "bank": bank_number,
                "orgAddress": origin,
                "endAddress": origin + 8192,
                "usedBytes": size,
                "freeBytes": 8192 - size,
                "resources": [
                    {
                        "id": 0,
                        "label": "TEST_RESOURCE",
                        "windowAddress": address,
                        "zoneOffset": offset,
                        "physicalAddress": 0x4000 + (bank_number * 8192) + offset,
                        "size": size,
                    }
                ],
            }
        ],
        "overflow": [],
    }
    banks = {
        "version": 1,
        "segmentSize": 8192,
        "dataWindow": {
            "page": "p3",
            "base": "#A000",
            "mask": "#1FFF",
            "bankDivisor": "#2000",
        },
        "banks": [
            {
                "bank": bank_number,
                "origin": origin,
                "end": origin + 8192,
                "usedBytes": size,
                "freeBytes": 8192 - size,
                "resources": [
                    {
                        "id": 0,
                        "label": "TEST_RESOURCE",
                        "address": address,
                        "offset": offset,
                        "size": size,
                    }
                ],
            }
        ],
        "overflow": [],
    }
    project_usage = {
        "version": 1,
        "scope": "konami8k_megarom_data",
        "counts": {
            "bankedResources": resource_count,
        },
        "features": {
            "sprites": True,
        },
        "resourceGroups": [
            {
                "key": "SPRITES",
                "count": resource_count,
            }
        ],
        "bankedResources": [
            {
                "id": 0,
                "label": "TEST_RESOURCE",
                "group": "SPRITES",
                "type": "SPRITE_PATTERNS",
                "bank": bank_number,
                "windowAddress": address,
                "size": size,
            }
        ],
    }
    (artifact_dir / "packing_manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    (artifact_dir / "banks.json").write_text(json.dumps(banks), encoding="utf-8")
    (artifact_dir / "project_usage.json").write_text(json.dumps(project_usage), encoding="utf-8")
    (artifact_dir / "unused_report.txt").write_text(
        "MIDEAS UNUSED MODULE REPORT\nScope: konami8k_megarom_resident_modules\n",
        encoding="utf-8",
    )
    (artifact_dir / "segment_budget.json").write_text(
        json.dumps(
            {
                "version": 1,
                "scope": "konami8k_segment_budget",
                "segmentSize": 8192,
                "codeBanks": [
                    {
                        "bank": 1,
                        "role": "resident_code",
                        "usedBytes": 1024,
                        "freeBytes": 7168,
                    }
                ],
                "dataBanks": [
                    {
                        "bank": bank_number,
                        "role": "asset_data",
                        "orgAddress": origin,
                        "endAddress": origin + 8192,
                        "usedBytes": size,
                        "freeBytes": 8192 - size,
                        "resources": 1,
                    }
                ],
            }
        ),
        encoding="utf-8",
    )


def main() -> int:
    builder = load_builder_module()
    with tempfile.TemporaryDirectory() as raw_tmp:
        tmpdir = Path(raw_tmp)

        rom, asm = write_case(tmpdir, VALID_ASM)
        result = builder.validate_konami8k_megarom(rom, asm)
        assert result["segment_count"] == 8
        assert result["size_bytes"] == 65536
        assert result["resource_count"] == 2
        assert result["resource_min_address"] == 0xA000
        assert result["resource_max_address"] == 0xBFFF

        bad_resource = VALID_ASM.replace("dw #A000", "dw #8000", 1)
        rom, asm = write_case(tmpdir, bad_resource)
        expect_failure(builder, rom, asm, "resource_table addresses must be in A000h-BFFFh")

        crossing_resource = VALID_ASM.replace("dw #BFFF\n    dw 1", "dw #BFFE\n    dw 2", 1)
        rom, asm = write_case(tmpdir, crossing_resource)
        result = builder.validate_konami8k_megarom(rom, asm)
        assert result["resource_count"] == 2

        crossing_resource = VALID_ASM.replace("dw #BFFF\n    dw 1", "dw #BFFE\n    dw 3", 1)
        rom, asm = write_case(tmpdir, crossing_resource)
        expect_failure(builder, rom, asm, "resource_table entries must not cross the A000h-BFFFh data window")

        zero_size_resource = VALID_ASM.replace("    dw 32", "    dw 0", 1)
        rom, asm = write_case(tmpdir, zero_size_resource)
        expect_failure(builder, rom, asm, "resource_table sizes must be greater than zero")

        bad_table_count = VALID_ASM.replace("RESOURCE_TABLE_COUNT EQU 2", "RESOURCE_TABLE_COUNT EQU 3")
        rom, asm = write_case(tmpdir, bad_table_count)
        expect_failure(builder, rom, asm, "RESOURCE_TABLE_COUNT does not match resource_table entries")

        missing_table_count = VALID_ASM.replace("RESOURCE_TABLE_COUNT EQU 2\n", "")
        rom, asm = write_case(tmpdir, missing_table_count)
        expect_failure(builder, rom, asm, "missing RESOURCE_TABLE_COUNT")

        missing_resource_table = VALID_ASM.replace("resource_table:", "resource_table_missing:")
        rom, asm = write_case(tmpdir, missing_resource_table)
        expect_failure(builder, rom, asm, "expected exactly one resource_table")

        duplicate_resource_table = VALID_ASM + "\nresource_table:\n"
        rom, asm = write_case(tmpdir, duplicate_resource_table)
        expect_failure(builder, rom, asm, "expected exactly one resource_table")

        bad_entry_size = VALID_ASM.replace("RESOURCE_TABLE_ENTRY_SIZE EQU 5", "RESOURCE_TABLE_ENTRY_SIZE EQU 8")
        rom, asm = write_case(tmpdir, bad_entry_size)
        expect_failure(builder, rom, asm, "RESOURCE_TABLE_ENTRY_SIZE must be 5")

        missing_entry_size = VALID_ASM.replace("RESOURCE_TABLE_ENTRY_SIZE EQU 5\n", "")
        rom, asm = write_case(tmpdir, missing_entry_size)
        expect_failure(builder, rom, asm, "missing RESOURCE_TABLE_ENTRY_SIZE")

        bad_table_bank = VALID_ASM.replace("    db 5\n    dw #BFFF", "    db 9\n    dw #BFFF")
        rom, asm = write_case(tmpdir, bad_table_bank)
        expect_failure(builder, rom, asm, "resource_table references banks outside the ROM")

        bad_bank_literal = VALID_ASM.replace("    db 4\n    dw #A000", "    db BANK_4\n    dw #A000")
        rom, asm = write_case(tmpdir, bad_bank_literal)
        expect_failure(builder, rom, asm, "invalid numeric literal in resource_table bank")

        bad_address_literal = VALID_ASM.replace("dw #A000", "dw A000", 1)
        rom, asm = write_case(tmpdir, bad_address_literal)
        expect_failure(builder, rom, asm, "invalid numeric literal in resource_table address")

        bad_size_literal = VALID_ASM.replace("    dw 32", "    dw SIZE_32", 1)
        rom, asm = write_case(tmpdir, bad_size_literal)
        expect_failure(builder, rom, asm, "invalid numeric literal in resource_table size")

        malformed_table = VALID_ASM.replace("    db 4\n    dw #A000\n    dw 32", "    db 4\n    dw #A000", 1)
        rom, asm = write_case(tmpdir, malformed_table)
        expect_failure(builder, rom, asm, "malformed resource_table entry")

        unexpected_table_line = VALID_ASM.replace("    db 5\n    dw #BFFF", "    ds 1\n    db 5\n    dw #BFFF", 1)
        rom, asm = write_case(tmpdir, unexpected_table_line)
        expect_failure(builder, rom, asm, "malformed resource_table entry")

        bad_mapper_register = VALID_ASM.replace("MAPPER_REG_P2       EQU #8000", "MAPPER_REG_P2       EQU #A000")
        rom, asm = write_case(tmpdir, bad_mapper_register)
        expect_failure(builder, rom, asm, "P2 mapper register must be #8000")

        bad_mapper = VALID_ASM.replace("Accessed through mapper P3", "Accessed through mapper P2")
        rom, asm = write_case(tmpdir, bad_mapper)
        expect_failure(builder, rom, asm, "banked data must use P3/A000h")

        bad_far_code = VALID_ASM + "\n; FAR BANK 9 — [#A000h-#C000h] FAR CODE: sound\n"
        rom, asm = write_case(tmpdir, bad_far_code)
        expect_failure(builder, rom, asm, "far code must not execute from the A000h data window")

        bad_mutable_map_window = VALID_ASM + """
read_runtime_behavior:
    ld a, (current_behavior_map_bank)
    call mapper_set_bank_p2
"""
        rom, asm = write_case(tmpdir, bad_mutable_map_window)
        expect_failure(builder, rom, asm, "mutable runtime maps must use P3/A000h")

        artifact_dir = tmpdir / "artifacts"
        write_valid_artifacts(artifact_dir)
        artifact_result = builder.validate_konami8k_generated_artifacts(artifact_dir)
        assert artifact_result["artifact_ok"] is True
        assert artifact_result["manifest_resource_count"] == 1
        assert artifact_result["manifest_bank_count"] == 1
        artifact_result = builder.validate_konami8k_generated_artifacts(
            artifact_dir,
            expected_resource_count=1,
            segment_count=5,
        )
        assert artifact_result["artifact_ok"] is True

        mismatched_count_dir = tmpdir / "mismatched_count_artifacts"
        write_valid_artifacts(mismatched_count_dir)
        try:
            builder.validate_konami8k_generated_artifacts(
                mismatched_count_dir,
                expected_resource_count=2,
                segment_count=5,
            )
        except RuntimeError as exc:
            if "packing_manifest.json resourceCount differs from resource_table" not in str(exc):
                raise
        else:
            raise AssertionError("Expected artifact validation to reject resource_table count mismatch")

        mismatched_usage_dir = tmpdir / "mismatched_usage_artifacts"
        write_valid_artifacts(mismatched_usage_dir)
        usage_path = mismatched_usage_dir / "project_usage.json"
        usage_data = json.loads(usage_path.read_text(encoding="utf-8"))
        usage_data["counts"]["bankedResources"] = 2
        usage_path.write_text(json.dumps(usage_data), encoding="utf-8")
        expect_artifact_failure(
            builder,
            mismatched_usage_dir,
            "project_usage.json bankedResources differs from resource_table",
        )

        mismatched_usage_resource_dir = tmpdir / "mismatched_usage_resource_artifacts"
        write_valid_artifacts(mismatched_usage_resource_dir)
        usage_path = mismatched_usage_resource_dir / "project_usage.json"
        usage_data = json.loads(usage_path.read_text(encoding="utf-8"))
        usage_data["bankedResources"][0]["windowAddress"] = 0xA010
        usage_path.write_text(json.dumps(usage_data), encoding="utf-8")
        expect_artifact_failure(
            builder,
            mismatched_usage_resource_dir,
            "project_usage.json bankedResources differ from banks.json",
        )

        out_of_rom_dir = tmpdir / "out_of_rom_artifacts"
        write_valid_artifacts(out_of_rom_dir, bank_number=6)
        try:
            builder.validate_konami8k_generated_artifacts(out_of_rom_dir, expected_resource_count=1, segment_count=6)
        except RuntimeError as exc:
            if "references a bank outside the ROM" not in str(exc):
                raise
        else:
            raise AssertionError("Expected artifact validation to reject a bank outside the ROM")

        mismatched_resource_dir = tmpdir / "mismatched_resource_artifacts"
        write_valid_artifacts(mismatched_resource_dir)
        banks_json_path = mismatched_resource_dir / "banks.json"
        banks_data = json.loads(banks_json_path.read_text(encoding="utf-8"))
        banks_data["banks"][0]["resources"][0]["address"] = 0xA010
        banks_json_path.write_text(json.dumps(banks_data), encoding="utf-8")
        expect_artifact_failure(
            builder,
            mismatched_resource_dir,
            "banks.json address does not match offset",
        )

        bad_manifest_offset_dir = tmpdir / "bad_manifest_offset_artifacts"
        write_valid_artifacts(bad_manifest_offset_dir)
        manifest_path = bad_manifest_offset_dir / "packing_manifest.json"
        manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest_data["banks"][0]["resources"][0]["zoneOffset"] = 8
        manifest_path.write_text(json.dumps(manifest_data), encoding="utf-8")
        expect_artifact_failure(
            builder,
            bad_manifest_offset_dir,
            "packing_manifest.json windowAddress does not match zoneOffset",
        )

        bad_manifest_physical_dir = tmpdir / "bad_manifest_physical_artifacts"
        write_valid_artifacts(bad_manifest_physical_dir)
        manifest_path = bad_manifest_physical_dir / "packing_manifest.json"
        manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest_data["banks"][0]["resources"][0]["physicalAddress"] += 1
        manifest_path.write_text(json.dumps(manifest_data), encoding="utf-8")
        expect_artifact_failure(
            builder,
            bad_manifest_physical_dir,
            "packing_manifest.json physicalAddress does not match bank and zoneOffset",
        )

        bad_manifest_size_dir = tmpdir / "bad_manifest_size_artifacts"
        write_valid_artifacts(bad_manifest_size_dir)
        manifest_path = bad_manifest_size_dir / "packing_manifest.json"
        manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest_data["banks"][0]["resources"][0]["size"] = 0
        manifest_path.write_text(json.dumps(manifest_data), encoding="utf-8")
        expect_artifact_failure(
            builder,
            bad_manifest_size_dir,
            "packing_manifest.json resource size must be greater than zero",
        )

        bad_banks_offset_dir = tmpdir / "bad_banks_offset_artifacts"
        write_valid_artifacts(bad_banks_offset_dir)
        banks_path = bad_banks_offset_dir / "banks.json"
        banks_data = json.loads(banks_path.read_text(encoding="utf-8"))
        banks_data["banks"][0]["resources"][0]["offset"] = 8
        banks_path.write_text(json.dumps(banks_data), encoding="utf-8")
        expect_artifact_failure(builder, bad_banks_offset_dir, "banks.json address does not match offset")

        bad_banks_size_dir = tmpdir / "bad_banks_size_artifacts"
        write_valid_artifacts(bad_banks_size_dir)
        banks_path = bad_banks_size_dir / "banks.json"
        banks_data = json.loads(banks_path.read_text(encoding="utf-8"))
        banks_data["banks"][0]["resources"][0]["size"] = 0
        banks_path.write_text(json.dumps(banks_data), encoding="utf-8")
        expect_artifact_failure(builder, bad_banks_size_dir, "banks.json resource size must be greater than zero")

        bad_banks_accounting_dir = tmpdir / "bad_banks_accounting_artifacts"
        write_valid_artifacts(bad_banks_accounting_dir)
        banks_json_path = bad_banks_accounting_dir / "banks.json"
        banks_data = json.loads(banks_json_path.read_text(encoding="utf-8"))
        banks_data["banks"][0]["freeBytes"] = 0
        banks_json_path.write_text(json.dumps(banks_data), encoding="utf-8")
        expect_artifact_failure(builder, bad_banks_accounting_dir, "banks.json bank accounting must equal 8192")

        bad_manifest_accounting_type_dir = tmpdir / "bad_manifest_accounting_type_artifacts"
        write_valid_artifacts(bad_manifest_accounting_type_dir)
        manifest_path = bad_manifest_accounting_type_dir / "packing_manifest.json"
        manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
        del manifest_data["banks"][0]["freeBytes"]
        manifest_path.write_text(json.dumps(manifest_data), encoding="utf-8")
        expect_artifact_failure(
            builder,
            bad_manifest_accounting_type_dir,
            "packing_manifest.json bank accounting must be numeric",
        )

        bad_manifest_accounting_range_dir = tmpdir / "bad_manifest_accounting_range_artifacts"
        write_valid_artifacts(bad_manifest_accounting_range_dir)
        manifest_path = bad_manifest_accounting_range_dir / "packing_manifest.json"
        manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest_data["banks"][0]["usedBytes"] = -1
        manifest_data["banks"][0]["freeBytes"] = 8193
        manifest_path.write_text(json.dumps(manifest_data), encoding="utf-8")
        expect_artifact_failure(
            builder,
            bad_manifest_accounting_range_dir,
            "packing_manifest.json bank accounting must equal 8192",
        )

        bad_banks_accounting_type_dir = tmpdir / "bad_banks_accounting_type_artifacts"
        write_valid_artifacts(bad_banks_accounting_type_dir)
        banks_path = bad_banks_accounting_type_dir / "banks.json"
        banks_data = json.loads(banks_path.read_text(encoding="utf-8"))
        banks_data["banks"][0]["usedBytes"] = "32"
        banks_path.write_text(json.dumps(banks_data), encoding="utf-8")
        expect_artifact_failure(
            builder,
            bad_banks_accounting_type_dir,
            "banks.json bank accounting must be numeric",
        )

        bad_banks_accounting_range_dir = tmpdir / "bad_banks_accounting_range_artifacts"
        write_valid_artifacts(bad_banks_accounting_range_dir)
        banks_path = bad_banks_accounting_range_dir / "banks.json"
        banks_data = json.loads(banks_path.read_text(encoding="utf-8"))
        banks_data["banks"][0]["usedBytes"] = 8193
        banks_data["banks"][0]["freeBytes"] = -1
        banks_path.write_text(json.dumps(banks_data), encoding="utf-8")
        expect_artifact_failure(
            builder,
            bad_banks_accounting_range_dir,
            "banks.json bank accounting must equal 8192",
        )

        bad_manifest_range_dir = tmpdir / "bad_manifest_range_artifacts"
        write_valid_artifacts(bad_manifest_range_dir)
        manifest_path = bad_manifest_range_dir / "packing_manifest.json"
        manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest_data["banks"][0]["endAddress"] += 1
        manifest_path.write_text(json.dumps(manifest_data), encoding="utf-8")
        expect_artifact_failure(builder, bad_manifest_range_dir, "packing_manifest.json bank range must match 8KB physical bank")

        bad_banks_range_dir = tmpdir / "bad_banks_range_artifacts"
        write_valid_artifacts(bad_banks_range_dir)
        banks_path = bad_banks_range_dir / "banks.json"
        banks_data = json.loads(banks_path.read_text(encoding="utf-8"))
        banks_data["banks"][0]["origin"] += 1
        banks_path.write_text(json.dumps(banks_data), encoding="utf-8")
        expect_artifact_failure(builder, bad_banks_range_dir, "banks.json bank range must match 8KB physical bank")

        bad_budget_data_dir = tmpdir / "bad_budget_data_artifacts"
        write_valid_artifacts(bad_budget_data_dir)
        budget_path = bad_budget_data_dir / "segment_budget.json"
        budget_data = json.loads(budget_path.read_text(encoding="utf-8"))
        budget_data["dataBanks"][0]["resources"] = 99
        budget_path.write_text(json.dumps(budget_data), encoding="utf-8")
        expect_artifact_failure(
            builder,
            bad_budget_data_dir,
            "segment_budget.json dataBanks differ from banks.json",
        )

        bad_budget_range_dir = tmpdir / "bad_budget_range_artifacts"
        write_valid_artifacts(bad_budget_range_dir)
        budget_path = bad_budget_range_dir / "segment_budget.json"
        budget_data = json.loads(budget_path.read_text(encoding="utf-8"))
        budget_data["dataBanks"][0]["orgAddress"] += 1
        budget_path.write_text(json.dumps(budget_data), encoding="utf-8")
        expect_artifact_failure(
            builder,
            bad_budget_range_dir,
            "segment_budget.json dataBanks differ from banks.json",
        )

        bad_resource_id_dir = tmpdir / "bad_resource_id_artifacts"
        write_valid_artifacts(bad_resource_id_dir)
        for file_name in ["packing_manifest.json", "banks.json"]:
            artifact_path = bad_resource_id_dir / file_name
            artifact_data = json.loads(artifact_path.read_text(encoding="utf-8"))
            artifact_data["banks"][0]["resources"][0]["id"] = 2
            artifact_path.write_text(json.dumps(artifact_data), encoding="utf-8")
        expect_artifact_failure(builder, bad_resource_id_dir, "resource ids must be contiguous from 0")

        bad_zone_count_dir = tmpdir / "bad_zone_count_artifacts"
        write_valid_artifacts(bad_zone_count_dir)
        manifest_path = bad_zone_count_dir / "packing_manifest.json"
        manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest_data["summary"]["zoneCount"] = 2
        manifest_path.write_text(json.dumps(manifest_data), encoding="utf-8")
        expect_artifact_failure(builder, bad_zone_count_dir, "packing_manifest.json zoneCount mismatch")

        manifest_overflow_dir = tmpdir / "manifest_overflow_artifacts"
        write_valid_artifacts(manifest_overflow_dir)
        manifest_path = manifest_overflow_dir / "packing_manifest.json"
        manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest_data["overflow"] = [{"label": "TOO_BIG", "size": 9000}]
        manifest_path.write_text(json.dumps(manifest_data), encoding="utf-8")
        expect_artifact_failure(builder, manifest_overflow_dir, "packing_manifest.json overflow list must be empty")

        banks_overflow_dir = tmpdir / "banks_overflow_artifacts"
        write_valid_artifacts(banks_overflow_dir)
        banks_path = banks_overflow_dir / "banks.json"
        banks_data = json.loads(banks_path.read_text(encoding="utf-8"))
        banks_data["overflow"] = [{"label": "TOO_BIG", "size": 9000}]
        banks_path.write_text(json.dumps(banks_data), encoding="utf-8")
        expect_artifact_failure(builder, banks_overflow_dir, "banks.json overflow list must be empty")

        missing_artifacts = tmpdir / "missing_artifacts"
        missing_artifacts.mkdir()
        expect_artifact_failure(builder, missing_artifacts, "missing generated artifact packing_manifest.json")

        crossing_artifact_dir = tmpdir / "crossing_artifacts"
        write_valid_artifacts(crossing_artifact_dir, address=0xBFFE, size=3)
        expect_artifact_failure(builder, crossing_artifact_dir, "manifest resource crosses data window")

    print("Konami 8K builder validation tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
