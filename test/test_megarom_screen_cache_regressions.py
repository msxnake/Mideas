#!/usr/bin/env python3
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Build a megarom unified ASM from a Mideas JSON project, "
            "validate screen/tilebank cache guards, and print impact metrics."
        )
    )
    parser.add_argument("--json", required=True, help="Path to the Mideas project JSON")
    parser.add_argument("--project-root", default=".", help="Path to the Mideas repository root")
    parser.add_argument(
        "--asm-output",
        help="Optional output path for generated ASM (default: server/temp/<name>_screen_cache_verify.asm)",
    )
    parser.add_argument(
        "--rom-output",
        help="Optional output path for generated ROM (default: server/temp/<name>_screen_cache_verify.rom)",
    )
    parser.add_argument(
        "--ts-build-dir",
        help="Optional temp TypeScript build dir (default: server/temp/tsbuild_verify_screen_cache)",
    )
    return parser.parse_args()


def run_command(command: list[str], cwd: Path) -> None:
    completed = subprocess.run(command, cwd=str(cwd), capture_output=True, text=True)
    if completed.stdout.strip():
        print(completed.stdout.strip())
    if completed.stderr.strip():
        print(completed.stderr.strip(), file=sys.stderr)
    if completed.returncode != 0:
        raise RuntimeError(f"Command failed ({completed.returncode}): {' '.join(str(part) for part in command)}")


def load_screen_assets(project_json: dict) -> list[dict]:
    screens: list[dict] = []
    for asset in project_json.get("assets", []):
        if asset.get("type") != "screenmap":
            continue
        data = asset.get("data")
        if isinstance(data, dict):
            screens.append(data)
        else:
            screens.append(asset)
    return screens


def build_metrics(screens: list[dict]) -> dict:
    tilebank_sequence = [str(screen.get("tileBankAssetId") or "").strip() for screen in screens]
    non_empty_tilebanks = [tilebank for tilebank in tilebank_sequence if tilebank]
    unique_tilebanks = sorted(set(non_empty_tilebanks))

    previous_tilebank = None
    new_loader_events = 0
    for tilebank in non_empty_tilebanks:
        if tilebank != previous_tilebank:
            new_loader_events += 1
            previous_tilebank = tilebank

    old_tilebank_loader_calls = len(non_empty_tilebanks) * 2
    new_tilebank_loader_calls = new_loader_events * 2
    saved_tilebank_loader_calls = old_tilebank_loader_calls - new_tilebank_loader_calls

    ram_cache_savings_per_reload = []
    screens_with_effect_zones = 0
    for screen in screens:
        effect_zones = screen.get("effectZones") or []
        has_effect_zones = len(effect_zones) > 0
        if has_effect_zones:
            screens_with_effect_zones += 1
        # Same-screen reload hit: layout + effects + behavior + optional zone table.
        ram_cache_savings_per_reload.append(4 if has_effect_zones else 3)

    return {
        "screen_count": len(screens),
        "screens_with_tilebank": len(non_empty_tilebanks),
        "unique_tilebanks": unique_tilebanks,
        "unique_tilebank_count": len(unique_tilebanks),
        "screens_with_effect_zones": screens_with_effect_zones,
        "old_tilebank_loader_calls": old_tilebank_loader_calls,
        "new_tilebank_loader_calls": new_tilebank_loader_calls,
        "saved_tilebank_loader_calls": saved_tilebank_loader_calls,
        "same_screen_reload_min_savings": min(ram_cache_savings_per_reload) if ram_cache_savings_per_reload else 0,
        "same_screen_reload_max_savings": max(ram_cache_savings_per_reload) if ram_cache_savings_per_reload else 0,
        "same_screen_reload_total_savings_once": sum(ram_cache_savings_per_reload),
    }


def assert_contains(haystack: str, needle: str, description: str) -> None:
    if needle not in haystack:
        raise AssertionError(f"Missing expected fragment: {description}")


def assert_regex(haystack: str, pattern: str, description: str) -> None:
    if not re.search(pattern, haystack, flags=re.MULTILINE | re.DOTALL):
        raise AssertionError(f"Missing expected pattern: {description}")


def assert_power_of_two(value: int, description: str) -> None:
    if value <= 0 or (value & (value - 1)) != 0:
        raise AssertionError(f"Expected power-of-two value for {description}, got {value}")


def main() -> int:
    args = parse_args()
    repo_root = Path(args.project_root).resolve()
    json_path = Path(args.json).expanduser().resolve()

    if not json_path.exists():
        raise FileNotFoundError(f"JSON not found: {json_path}")

    project_json = json.loads(json_path.read_text(encoding="utf-8"))
    screens = load_screen_assets(project_json)
    metrics = build_metrics(screens)

    stem = json_path.stem
    asm_output = Path(args.asm_output).resolve() if args.asm_output else (repo_root / "server" / "temp" / f"{stem}_screen_cache_verify.asm")
    rom_output = Path(args.rom_output).resolve() if args.rom_output else (repo_root / "server" / "temp" / f"{stem}_screen_cache_verify.rom")
    ts_build_dir = Path(args.ts_build_dir).resolve() if args.ts_build_dir else (repo_root / "server" / "temp" / "tsbuild_verify_screen_cache")

    asm_output.parent.mkdir(parents=True, exist_ok=True)
    rom_output.parent.mkdir(parents=True, exist_ok=True)

    build_command = [
        sys.executable,
        "scripts/build_mideas_unified_rom.py",
        "--json",
        str(json_path),
        "--project-root",
        str(repo_root),
        "--asm-output",
        str(asm_output),
        "--rom-output",
        str(rom_output),
        "--ts-build-dir",
        str(ts_build_dir),
        "--rom-mode",
        "megarom",
        "--target-format",
        "konami",
    ]

    print(f"Building megarom for {json_path.name} ...")
    run_command(build_command, repo_root)

    asm_text = asm_output.read_text(encoding="utf-8", errors="ignore")

    assert_contains(asm_text, "resource_load_screen_layout_cached:", "screen-layout RAM cache helper")
    assert_contains(asm_text, "resource_load_effects_layout_cached:", "effects-layout RAM cache helper")
    assert_contains(asm_text, "resource_load_behavior_map_cached:", "behavior-map RAM cache helper")
    assert_contains(asm_text, "resource_load_effect_zone_table_cached:", "effect-zone RAM cache helper")
    assert_contains(asm_text, "current_screen2_tilebank_id EQU", "runtime SCREEN 2 tilebank state")
    assert_contains(asm_text, "SCREEN2_TILEBANK_INVALID EQU #FF", "tilebank invalid sentinel")

    if metrics["unique_tilebank_count"] > 0:
        assert_regex(asm_text, r"SCREEN2_TILEBANK_[A-Z0-9_]+_ID EQU \d+", "tilebank ID constants")

    assert_regex(
        asm_text,
        r"resource_invalidate_gameplay_vram_cache:.*ld \(current_screen2_tilebank_id\), a",
        "tilebank state reset on gameplay VRAM invalidation",
    )

    guard_occurrences = asm_text.count("ld a, (current_screen2_tilebank_id)")
    cached_layout_occurrences = asm_text.count("call resource_load_screen_layout_cached")
    cached_behavior_occurrences = asm_text.count("call resource_load_behavior_map_cached")

    if metrics["screens_with_tilebank"] > 0 and guard_occurrences < metrics["screens_with_tilebank"]:
        raise AssertionError(
            f"Expected at least {metrics['screens_with_tilebank']} tilebank guards, found {guard_occurrences}"
        )

    if metrics["screen_count"] > 0 and cached_layout_occurrences < metrics["screen_count"]:
        raise AssertionError(
            f"Expected at least {metrics['screen_count']} cached layout loads, found {cached_layout_occurrences}"
        )

    if metrics["screen_count"] > 0 and cached_behavior_occurrences < metrics["screen_count"]:
        raise AssertionError(
            f"Expected at least {metrics['screen_count']} cached behavior loads, found {cached_behavior_occurrences}"
        )

    rom_size = rom_output.stat().st_size
    if rom_size % 8192 != 0:
        raise AssertionError(f"Expected ROM size to be multiple of 8192, got {rom_size}")

    megarom_bank_count = rom_size // 8192
    assert_power_of_two(megarom_bank_count, "megarom 8KB bank count")

    print("")
    print("Regression checks:")
    print(f"- Screens: {metrics['screen_count']}")
    print(f"- Screens with tilebank: {metrics['screens_with_tilebank']}")
    print(f"- Unique tilebanks: {metrics['unique_tilebank_count']} ({', '.join(metrics['unique_tilebanks']) if metrics['unique_tilebanks'] else 'none'})")
    print(f"- Tilebank guards in ASM: {guard_occurrences}")
    print(f"- Cached layout loads in ASM: {cached_layout_occurrences}")
    print(f"- Cached behavior loads in ASM: {cached_behavior_occurrences}")
    print(f"- ROM size: {rom_size} bytes ({megarom_bank_count} x 8KB banks)")

    print("")
    print("Impact estimate:")
    print(f"- Tilebank loader calls before: {metrics['old_tilebank_loader_calls']}")
    print(f"- Tilebank loader calls after: {metrics['new_tilebank_loader_calls']}")
    print(f"- Tilebank loader calls avoided over one asset-order pass: {metrics['saved_tilebank_loader_calls']}")
    print(f"- Same-screen reload savings: {metrics['same_screen_reload_min_savings']}..{metrics['same_screen_reload_max_savings']} banked RAM resource reads avoided per reload")
    print(f"- Same-screen reload savings if every screen reloads once: {metrics['same_screen_reload_total_savings_once']}")
    print(f"- Screens with effect zones: {metrics['screens_with_effect_zones']}")
    print("")
    print(f"Artifacts:")
    print(f"- ASM: {asm_output}")
    print(f"- ROM: {rom_output}")
    print("")
    print("Screen/tilebank cache regression check passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Screen/tilebank cache regression check failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
