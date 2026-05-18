#!/usr/bin/env python3
import argparse
import subprocess
import sys
from pathlib import Path


def configure_stdio() -> None:
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")


DEFAULT_MODES = ("simple32k", "plain48k", "megarom")
DEFAULT_TARGET_FORMATS = ("konami",)
SUPPORTED_TARGET_FORMATS = ("konami", "ascii8", "ascii16")
STRICT_PROMOTABLE_MAPPER_FORMATS = ("ascii16",)
SUMMARY_PATTERNS = (
    "Done.",
    "ROM:",
    "ZX0:",
    "Konami8K validation:",
    "Konami8K artifacts:",
    "MegaROM mapper artifacts:",
    "ASCII16 runtime layout:",
    "Dead-block candidates:",
    "OpenMSX smoke:",
    "Post-ASM:",
    "Post-ASM report:",
    "Post-ASM savings:",
    "Post-ASM passes:",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the Mideas compile/OpenMSX regression matrix for a project JSON."
    )
    parser.add_argument(
        "--json",
        action="append",
        required=True,
        help="Path to Mideas project JSON. Repeat to run the same matrix against multiple projects.",
    )
    parser.add_argument(
        "--skip-missing-json",
        action="store_true",
        help="Skip missing --json inputs instead of failing before the matrix starts.",
    )
    parser.add_argument("--project-root", default=".", help="Mideas repository root")
    parser.add_argument(
        "--artifact-dir",
        help="Directory for generated ASM/ROM/SYM/log artifacts (default: <project-root>/server/temp).",
    )
    parser.add_argument(
        "--modes",
        default=",".join(DEFAULT_MODES),
        help="Comma-separated ROM modes to test (default: simple32k,plain48k,megarom)",
    )
    parser.add_argument(
        "--target-format",
        choices=SUPPORTED_TARGET_FORMATS,
        default="konami",
        help="Mapper format for MegaROM tests when --target-formats is omitted (default: konami)",
    )
    parser.add_argument(
        "--target-formats",
        help="Comma-separated mapper formats for MegaROM tests, e.g. konami,ascii8,ascii16",
    )
    parser.add_argument(
        "--execution-mode",
        choices=["gameLoopHalt", "interruptTaskManager"],
        default="interruptTaskManager",
        help="Engine execution mode (default: interruptTaskManager)",
    )
    parser.add_argument(
        "--no-openmsx-smoke",
        action="store_true",
        help="Compile only; do not run the OpenMSX smoke probes",
    )
    parser.add_argument(
        "--force-openmsx-smoke-compile-only",
        action="store_true",
        help="Force OpenMSX smoke for mapper targets that normally require a strict promotion gate.",
    )
    parser.add_argument(
        "--openmsx-smoke-require-movement",
        action="store_true",
        help="Fail smoke tests if cursor input does not move the probed player sprite",
    )
    parser.add_argument(
        "--openmsx-smoke-romtype-modes",
        default="forced",
        help="Comma-separated OpenMSX smoke mapper modes: forced,auto. Use forced,auto to test with and without -romtype.",
    )
    parser.add_argument(
        "--strict-tilebank-integrity",
        action="store_true",
        help="Fail MegaROM builds when tilebank_integrity.json reports issue cells",
    )
    parser.add_argument(
        "--strict-p3-data-window",
        action="store_true",
        help="Fail Konami MegaROM builds when resident code occupies the P3 data window",
    )
    parser.add_argument(
        "--strict-vram-staging",
        action="store_true",
        help="Fail Konami MegaROM builds when compressed VRAM resources exceed the RAM staging buffer",
    )
    parser.add_argument(
        "--strict-ascii16-runtime-layout",
        action="store_true",
        help="Fail ASCII16 MegaROM builds while runtimeLayout or assembled symbols report unsafe smoke hazards",
    )
    parser.add_argument(
        "--strict-ascii16-resident-free-bytes",
        type=int,
        default=0,
        help="Fail ASCII16 MegaROM builds when resident code leaves less than this many free bytes; 0 disables the gate",
    )
    parser.add_argument(
        "--strict-post-asm-no-dead-blocks",
        action="store_true",
        help="Fail builds when post-ASM dead-block analysis finds remaining annotated dead-code candidates",
    )
    parser.add_argument(
        "--post-asm-opt",
        action="store_true",
        help="Run post-ASM optimization before compiling each matrix build",
    )
    parser.add_argument(
        "--post-asm-check-only",
        action="store_true",
        help="Run post-ASM analysis for each matrix build but compile the original ASM",
    )
    parser.add_argument(
        "--post-asm-rules",
        help=(
            "Comma-separated post-ASM rule ids to pass through to build_mideas_unified_rom.py "
            "(default follows build script mode)"
        ),
    )
    parser.add_argument(
        "--post-asm-passes",
        type=int,
        default=1,
        help="Maximum post-ASM optimization passes when --post-asm-opt applies changes",
    )
    parser.add_argument("--openmsx-path", help="Explicit openmsx executable path")
    parser.add_argument(
        "--openmsx-timeout",
        type=float,
        default=45.0,
        help="Seconds to wait for each OpenMSX smoke attempt (default: 45)",
    )
    parser.add_argument(
        "--keep-going",
        action="store_true",
        help="Run remaining modes after a failure and report all failures at the end",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Stream full build output instead of writing per-mode logs and printing a compact summary",
    )
    return parser.parse_args()


def resolve_project_root(path_str: str) -> Path:
    root = Path(path_str).expanduser().resolve()
    if not (root / "scripts" / "build_mideas_unified_rom.py").exists():
        raise FileNotFoundError(f"Not a Mideas project root: {root}")
    return root


def mode_suffix(mode: str, target_format: str) -> str:
    return f"{mode}_{target_format}" if mode == "megarom" else mode


def parse_target_formats(args: argparse.Namespace) -> list[str]:
    raw = args.target_formats or args.target_format or ",".join(DEFAULT_TARGET_FORMATS)
    formats = [target.strip() for target in raw.split(",") if target.strip()]
    invalid_formats = [target for target in formats if target not in SUPPORTED_TARGET_FORMATS]
    if invalid_formats:
        raise ValueError(f"Unsupported mapper format(s): {', '.join(invalid_formats)}")
    return formats or list(DEFAULT_TARGET_FORMATS)


def build_matrix_cases(modes: list[str], target_formats: list[str]) -> list[tuple[str, str]]:
    cases: list[tuple[str, str]] = []
    for mode in modes:
        if mode == "megarom":
            cases.extend((mode, target_format) for target_format in target_formats)
        else:
            cases.append((mode, target_formats[0]))
    return cases


def parse_smoke_romtype_modes(args: argparse.Namespace) -> list[str]:
    if args.no_openmsx_smoke:
        return ["forced"]
    raw_modes = [mode.strip() for mode in args.openmsx_smoke_romtype_modes.split(",") if mode.strip()]
    invalid_modes = [mode for mode in raw_modes if mode not in ("forced", "auto")]
    if invalid_modes:
        raise ValueError(f"Unsupported OpenMSX smoke romtype mode(s): {', '.join(invalid_modes)}")
    return raw_modes or ["forced"]


def print_compact_log_summary(log_path: Path, return_code: int) -> None:
    if not log_path.exists():
        print(f"log: missing ({log_path})", flush=True)
        return

    lines = log_path.read_text(encoding="utf-8", errors="replace").splitlines()
    for line in lines:
        stripped = line.strip()
        if any(stripped.startswith(pattern) for pattern in SUMMARY_PATTERNS):
            print(stripped, flush=True)

    if return_code != 0:
        print(f"failure log tail: {log_path}", flush=True)
        for line in lines[-80:]:
            print(line, flush=True)
    else:
        print(f"log: {log_path}", flush=True)


def main() -> int:
    configure_stdio()
    args = parse_args()
    project_root = resolve_project_root(args.project_root)
    json_paths = [Path(json_arg).expanduser().resolve() for json_arg in args.json]
    missing_jsons = [path for path in json_paths if not path.exists()]
    if missing_jsons:
        if not args.skip_missing_json:
            raise FileNotFoundError(f"JSON not found: {missing_jsons[0]}")
        for missing_json in missing_jsons:
            print(f"Skipping missing JSON: {missing_json}", flush=True)
        json_paths = [path for path in json_paths if path.exists()]
        if not json_paths:
            print("No existing JSON inputs remain after --skip-missing-json", file=sys.stderr, flush=True)
            return 1

    modes = [mode.strip() for mode in args.modes.split(",") if mode.strip()]
    invalid_modes = [mode for mode in modes if mode not in DEFAULT_MODES]
    if invalid_modes:
        raise ValueError(f"Unsupported ROM mode(s): {', '.join(invalid_modes)}")
    target_formats = parse_target_formats(args)
    matrix_cases = build_matrix_cases(modes, target_formats)
    smoke_romtype_modes = parse_smoke_romtype_modes(args)

    build_script = project_root / "scripts" / "build_mideas_unified_rom.py"
    temp_dir = Path(args.artifact_dir).expanduser().resolve() if args.artifact_dir else project_root / "server" / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    results: list[tuple[str, str, int]] = []

    stop_requested = False
    for json_path in json_paths:
        for mode, target_format in matrix_cases:
            suffix = mode_suffix(mode, target_format)
            mapper_requires_strict_promotion = (
                mode == "megarom"
                and target_format in STRICT_PROMOTABLE_MAPPER_FORMATS
                and not args.strict_ascii16_runtime_layout
            )
            base_smoke_enabled = (
                not args.no_openmsx_smoke
                and (not mapper_requires_strict_promotion or args.force_openmsx_smoke_compile_only)
            )
            case_smoke_modes = smoke_romtype_modes if base_smoke_enabled else ["forced"]
            for smoke_romtype_mode in case_smoke_modes:
                display_suffix = suffix
                if base_smoke_enabled and smoke_romtype_mode == "auto":
                    display_suffix = f"{suffix}_openmsx_auto"
                stem = f"{json_path.stem}_matrix_{display_suffix}"
                cmd = [
                    sys.executable,
                    str(build_script),
                    "--json",
                    str(json_path),
                    "--project-root",
                    str(project_root),
                    "--rom-mode",
                    mode,
                    "--target-format",
                    target_format,
                    "--execution-mode",
                    args.execution_mode,
                    "--asm-output",
                    str(temp_dir / f"{stem}.asm"),
                    "--rom-output",
                    str(temp_dir / f"{stem}.rom"),
                    "--sym-output",
                    str(temp_dir / f"{stem}.sym"),
                ]
                if base_smoke_enabled:
                    cmd.extend(["--openmsx-smoke", "--openmsx-timeout", str(args.openmsx_timeout)])
                    if smoke_romtype_mode == "auto":
                        cmd.append("--openmsx-smoke-no-forced-romtype")
                if args.openmsx_smoke_require_movement:
                    cmd.append("--openmsx-smoke-require-movement")
                if args.strict_tilebank_integrity:
                    cmd.append("--strict-tilebank-integrity")
                if args.strict_p3_data_window:
                    cmd.append("--strict-p3-data-window")
                if args.strict_vram_staging:
                    cmd.append("--strict-vram-staging")
                if args.strict_ascii16_runtime_layout:
                    cmd.append("--strict-ascii16-runtime-layout")
                if args.strict_ascii16_resident_free_bytes > 0:
                    cmd.extend([
                        "--strict-ascii16-resident-free-bytes",
                        str(args.strict_ascii16_resident_free_bytes),
                    ])
                if args.strict_post_asm_no_dead_blocks:
                    cmd.append("--strict-post-asm-no-dead-blocks")
                if args.post_asm_opt:
                    cmd.append("--post-asm-opt")
                if args.post_asm_check_only:
                    cmd.append("--post-asm-check-only")
                if args.post_asm_rules:
                    cmd.extend(["--post-asm-rules", args.post_asm_rules])
                if args.post_asm_opt or args.post_asm_check_only or args.strict_post_asm_no_dead_blocks:
                    cmd.extend(["--post-asm-passes", str(args.post_asm_passes)])
                if args.openmsx_path:
                    cmd.extend(["--openmsx-path", args.openmsx_path])

                print(f"\n=== Mideas regression: {json_path.name} / {display_suffix} ===", flush=True)
                if mapper_requires_strict_promotion and not base_smoke_enabled and not args.no_openmsx_smoke:
                    print(
                        f"{suffix}: OpenMSX smoke skipped; pass --strict-ascii16-runtime-layout or --force-openmsx-smoke-compile-only to exercise this mapper",
                        flush=True,
                    )
                log_path = temp_dir / f"{stem}_build.log"
                if args.verbose:
                    completed = subprocess.run(cmd, cwd=str(project_root))
                else:
                    with log_path.open("w", encoding="utf-8", errors="replace") as log_fh:
                        completed = subprocess.run(
                            cmd,
                            cwd=str(project_root),
                            stdout=log_fh,
                            stderr=subprocess.STDOUT,
                            text=True,
                            encoding="utf-8",
                            errors="replace",
                        )
                    print_compact_log_summary(log_path, completed.returncode)
                results.append((json_path.name, display_suffix, completed.returncode))
                if completed.returncode != 0 and not args.keep_going:
                    stop_requested = True
                    break
            if stop_requested:
                break
        if stop_requested:
            break

    print("\n=== Matrix summary ===", flush=True)
    for json_name, suffix, return_code in results:
        print(f"{json_name} / {suffix}: {'ok' if return_code == 0 else f'failed ({return_code})'}", flush=True)

    return 0 if results and all(return_code == 0 for _, _, return_code in results) else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Regression matrix failed: {exc}", file=sys.stderr, flush=True)
        raise SystemExit(1)
