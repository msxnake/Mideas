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


def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def write_large_vram_artifacts(builder, artifact_dir: Path) -> None:
    artifact_dir.mkdir(parents=True, exist_ok=True)
    bank = 4
    origin = 0x4000 + (bank * 8192)
    stored_size = 64
    raw_size = builder.ZX0_VRAM_TRANSFER_BUFFER_SIZE + 1
    label = "BIG_TILE_PATTERN"
    placement_reason = "test compressed VRAM fallback candidate; bank=4; offset=#0000"
    resource = {
        "id": 0,
        "label": label,
        "resourceIdLabel": "RESOURCE_ID_BIG_TILE_PATTERN",
        "group": "PATTERNS",
        "type": "TILE_PATTERNS",
        "bank": bank,
        "zoneOffset": 0,
        "physicalAddress": origin,
        "windowAddress": 0xA000,
        "size": stored_size,
        "storedSize": stored_size,
        "uncompressedSize": raw_size,
        "flags": 1,
        "sourceIndex": 0,
        "placementReason": placement_reason,
    }
    verification = {
        "algorithm": "fnv1a32-resource-metadata",
        "metadataChecksum": builder._bank_metadata_checksum([
            bank,
            stored_size,
            0,
            label,
            0,
            stored_size,
            raw_size,
            1,
        ]),
        "resourceCount": 1,
        "storedBytes": stored_size,
    }
    mapper = {
        "format": "konami",
        "segmentSize": 8192,
        "dataWindowPage": "p3",
        "windowBase": "#A000",
        "windowMask": "#1FFF",
        "bankDivisor": "#2000",
    }
    write_json(
        artifact_dir / "packing_manifest.json",
        {
            "version": 1,
            "mapper": {
                "format": "konami",
                "dataWindowPage": "p3",
                "windowBase": "#A000",
                "windowMask": "#1FFF",
                "bankDivisor": "#2000",
                "zoneSize": 8192,
            },
            "summary": {
                "dataStartAddress": origin,
                "totalSourceBytes": stored_size,
                "resourceCount": 1,
                "zoneCount": 1,
                "overflowCount": 0,
            },
            "banks": [
                {
                    "bank": bank,
                    "zoneIndex": 0,
                    "orgAddress": origin,
                    "endAddress": origin + 8192,
                    "usedBytes": stored_size,
                    "freeBytes": 8192 - stored_size,
                    "verification": verification,
                    "resources": [resource],
                }
            ],
            "overflow": [],
        },
    )
    write_json(
        artifact_dir / "banks.json",
        {
            "version": 1,
            "mapperFormat": "konami",
            "segmentSize": 8192,
            "dataWindow": {
                "page": "p3",
                "base": "#A000",
                "mask": "#1FFF",
                "bankDivisor": "#2000",
            },
            "banks": [
                {
                    "bank": bank,
                    "origin": origin,
                    "end": origin + 8192,
                    "usedBytes": stored_size,
                    "freeBytes": 8192 - stored_size,
                    "verification": verification,
                    "resources": [
                        {
                            "id": 0,
                            "label": label,
                            "bank": bank,
                            "offset": 0,
                            "address": 0xA000,
                            "size": stored_size,
                            "storedSize": stored_size,
                            "uncompressedSize": raw_size,
                            "flags": 1,
                            "group": "PATTERNS",
                            "type": "TILE_PATTERNS",
                            "placementReason": placement_reason,
                        }
                    ],
                }
            ],
            "overflow": [],
        },
    )
    write_json(
        artifact_dir / "manifest_v2.json",
        {
            "schema": "mideas.manifest/2",
            "build_id": "mideas-v2:1234abcd",
            "cartridge": {
                "mapper": "KONAMI8K",
                "bank_size": 8192,
                "data_window": {
                    "page": "p3",
                    "base": "#A000",
                    "mask": "#1FFF",
                    "bank_divisor": "#2000",
                },
            },
            "layout": {
                "file_offset_rule": "file_offset = rom_bank_index * bank_size + bank_offset",
                "data_start_address": origin,
            },
            "groups": [
                {
                    "name": "boot",
                    "fixed_bank": 0,
                }
            ],
            "resources": [
                {
                    "id": 0,
                    "symbol": label,
                    "compress": "zx0",
                    "lifetime": "persistent",
                    "runtime_target": "VRAM",
                    "size": {
                        "stored": stored_size,
                        "uncompressed": raw_size,
                    },
                    "flags": 1,
                    "placement": {
                        "bank_index": bank,
                        "rom_bank_index": bank,
                        "bank_offset": 0,
                        "window": "#A000",
                        "window_address": 0xA000,
                        "physical_address": origin,
                        "file_offset": bank * 8192,
                    },
                }
            ],
            "verification": {
                "algorithm": "fnv1a32-resource-metadata",
                "banks": [],
                "expected_ram_dumps": [],
            },
        },
    )
    write_json(
        artifact_dir / "project_usage.json",
        {
            "version": 1,
            "scope": "konami8k_megarom_data",
            "mapper": mapper,
            "features": {"tiles": True},
            "counts": {"screens": 0, "bankedResources": 1},
            "resourceGroups": [{"key": "PATTERNS", "count": 1}],
            "resourceTypes": [{"key": "TILE_PATTERNS", "count": 1}],
            "scenes": [],
            "bankedResources": [
                {
                    "id": 0,
                    "label": label,
                    "group": "PATTERNS",
                    "type": "TILE_PATTERNS",
                    "bank": bank,
                    "windowAddress": 0xA000,
                    "size": stored_size,
                    "storedSize": stored_size,
                    "uncompressedSize": raw_size,
                    "flags": 1,
                }
            ],
        },
    )
    write_json(
        artifact_dir / "load_plan.json",
        {
            "version": 1,
            "scope": "konami8k_scene_load_plan",
            "mapper": mapper,
            "summary": {
                "sceneCount": 0,
                "resourceCount": 1,
                "uniqueDataBanks": 1,
                "totalSceneBankTouches": 0,
                "maxSceneBankTouches": 0,
                "totalStoredBytes": stored_size,
                "totalRawBytes": raw_size,
                "compressedResources": 1,
            },
            "scenes": [],
        },
    )
    current_bank = {
        "bank": bank,
        "count": 1,
        "storedBytes": stored_size,
        "rawBytes": raw_size,
        "resourceIds": [0],
        "resourceLabels": [label],
    }
    write_json(
        artifact_dir / "bank_optimizer.json",
        {
            "version": 1,
            "scope": "konami8k_bank_optimizer",
            "strategy": "test fixture",
            "constraints": {
                "mapperFormat": "konami",
                "segmentSize": 8192,
                "dynamicWindows": 1,
                "dataWindow": {
                    "page": "p3",
                    "base": "#A000",
                    "mask": "#1FFF",
                    "bankDivisor": "#2000",
                },
                "maxRecommendedSceneBanks": 3,
            },
            "currentPlacement": {
                "bankCount": 1,
                "resourceCount": 1,
                "totalStoredBytes": stored_size,
                "totalRawBytes": raw_size,
                "compressedResources": 1,
                "banks": [current_bank],
            },
            "proposedPlacement": {
                "strategy": "test fixture",
                "zoneSize": 8192,
                "bankCount": 1,
                "resourceCount": 1,
                "totalStoredBytes": stored_size,
                "banks": [
                    {
                        "bank": bank,
                        "usedBytes": stored_size,
                        "freeBytes": 8192 - stored_size,
                        "units": [],
                        "resourceIds": [0],
                        "resourceLabels": [label],
                    }
                ],
                "sceneBankPlan": [],
                "delta": {
                    "currentBankCount": 1,
                    "proposedBankCount": 1,
                    "currentSceneBankTouches": 0,
                    "proposedSceneBankTouches": 0,
                },
            },
            "sceneClusters": [],
            "pressureWarnings": [],
            "sharedOrGlobalResources": [],
            "duplicationCandidates": [],
        },
    )
    write_json(
        artifact_dir / "tilebank_integrity.json",
        {
            "version": 1,
            "scope": "konami8k_tilebank_integrity",
            "summary": {
                "screens": 0,
                "tileBanks": 0,
                "checkedScreens": 0,
                "issueScreens": 0,
                "issueCells": 0,
                "issueTiles": 0,
                "missingAssetCells": 0,
                "missingAssetTiles": 0,
                "unassignedCells": 0,
                "unassignedTiles": 0,
            },
            "screens": [],
        },
    )
    write_json(
        artifact_dir / "segment_budget.json",
        {
            "version": 1,
            "scope": "konami8k_segment_budget",
            "segmentSize": 8192,
            "codeBanks": [
                {
                    "bank": 1,
                    "role": "resident_code",
                    "page": 1,
                    "orgAddress": 0x6000,
                    "endAddress": 0x8000,
                    "estimatedUsedBytes": 1,
                    "estimatedFreeBytes": 8191,
                    "placementReason": "test resident code",
                    "modules": [{"key": "main", "placementReason": "test module"}],
                }
            ],
            "dataBanks": [
                {
                    "bank": bank,
                    "role": "asset_data",
                    "orgAddress": origin,
                    "endAddress": origin + 8192,
                    "usedBytes": stored_size,
                    "freeBytes": 8192 - stored_size,
                    "resources": 1,
                }
            ],
        },
    )
    (artifact_dir / "unused_report.txt").write_text(
        "MIDEAS UNUSED MODULE REPORT\nScope: konami8k_megarom_resident_modules\n",
        encoding="utf-8",
    )


def main() -> int:
    builder = load_builder_module()
    with tempfile.TemporaryDirectory() as raw_tmp:
        artifact_dir = Path(raw_tmp) / "artifacts"
        write_large_vram_artifacts(builder, artifact_dir)
        result = builder.validate_konami8k_generated_artifacts(artifact_dir)
        assert result["large_vram_resource_count"] == 1
        assert result["large_vram_resource_max"] == builder.ZX0_VRAM_TRANSFER_BUFFER_SIZE + 1
        try:
            builder.validate_konami8k_generated_artifacts(artifact_dir, strict_vram_staging=True)
        except RuntimeError as exc:
            message = str(exc)
            assert "compressed VRAM resources must fit" in message
            assert "BIG_TILE_PATTERN" in message
        else:
            raise AssertionError("strict_vram_staging should reject direct-to-VRAM fallback candidates")
    print("Konami 8K VRAM staging validation tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
