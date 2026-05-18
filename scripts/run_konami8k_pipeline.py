#!/usr/bin/env python3
import argparse
import subprocess
import sys
import tempfile
from pathlib import Path


def configure_stdio() -> None:
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")


BASELINE_JSON_NAMES = (
    "joc51.json",
    "joc_tales_9.json",
    "patoantic248.json",
    "joc60.json",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Run the Konami 8K MegaROM acceptance pipeline over the baseline "
            "Mideas project JSONs."
        )
    )
    parser.add_argument("--project-root", default=".", help="Mideas repository root")
    parser.add_argument(
        "--downloads-dir",
        default=str(Path.home() / "Downloads"),
        help="Directory used to resolve default baseline JSON files",
    )
    parser.add_argument(
        "--no-recursive-downloads",
        action="store_true",
        help="Only look for baseline JSONs directly in --downloads-dir.",
    )
    parser.add_argument(
        "--json",
        action="append",
        help=(
            "Project JSON to test. Repeat to override/extend the baseline set; "
            "when omitted, joc51/joc_tales_9/patoantic248/joc60 are used from --downloads-dir."
        ),
    )
    parser.add_argument(
        "--artifact-dir",
        help=(
            "Directory for generated ASM/ROM/SYM/log artifacts "
            "(default: system temp/mideas_konami8k_pipeline)"
        ),
    )
    parser.add_argument(
        "--fail-missing-json",
        action="store_true",
        help="Fail when a baseline JSON is missing instead of skipping it.",
    )
    parser.add_argument(
        "--no-openmsx-smoke",
        action="store_true",
        help="Compile and validate artifacts only; do not launch OpenMSX.",
    )
    parser.add_argument("--openmsx-path", help="Explicit openmsx executable path")
    parser.add_argument(
        "--openmsx-timeout",
        type=float,
        default=45.0,
        help="Seconds to wait for each OpenMSX smoke attempt (default: 45)",
    )
    parser.add_argument(
        "--openmsx-smoke-romtype-modes",
        default="forced",
        help="Comma-separated OpenMSX romtype smoke modes passed to the matrix runner.",
    )
    parser.add_argument(
        "--strict-tilebank-integrity",
        action="store_true",
        help=(
            "Also fail when tilebank_integrity.json reports project-data issues. "
            "This is off by default because some legacy fixtures intentionally "
            "still carry missing tile references."
        ),
    )
    parser.add_argument(
        "--post-asm-check-only",
        action="store_true",
        default=True,
        help="Run post-ASM analysis but compile the original ASM (default).",
    )
    parser.add_argument(
        "--post-asm-opt",
        action="store_true",
        help="Compile the post-ASM optimized ASM instead of check-only analysis.",
    )
    parser.add_argument(
        "--strict-post-asm-no-dead-blocks",
        action="store_true",
        help="Fail when post-ASM analysis reports annotated dead-block candidates.",
    )
    parser.add_argument(
        "--keep-going",
        action="store_true",
        help="Run remaining projects after a failure and report all failures.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the resolved matrix command without executing it.",
    )
    return parser.parse_args()


def resolve_project_root(path_str: str) -> Path:
    root = Path(path_str).expanduser().resolve()
    if not (root / "scripts" / "run_mideas_regression_matrix.py").exists():
        raise FileNotFoundError(f"Not a Mideas project root: {root}")
    return root


def resolve_json_paths(args: argparse.Namespace) -> list[Path]:
    if args.json:
        return [Path(json_arg).expanduser().resolve() for json_arg in args.json]

    downloads_dir = Path(args.downloads_dir).expanduser().resolve()
    return [resolve_baseline_json(downloads_dir, name, not args.no_recursive_downloads) for name in BASELINE_JSON_NAMES]


def resolve_baseline_json(downloads_dir: Path, file_name: str, recursive: bool) -> Path:
    direct_path = (downloads_dir / file_name).resolve()
    if not recursive:
        return direct_path

    candidates = [path.resolve() for path in downloads_dir.rglob(file_name) if path.is_file()]
    if not candidates:
        return direct_path

    return max(candidates, key=lambda path: path.stat().st_mtime)


def build_matrix_command(args: argparse.Namespace, project_root: Path) -> list[str]:
    artifact_dir = (
        Path(args.artifact_dir).expanduser().resolve()
        if args.artifact_dir
        else Path(tempfile.gettempdir()).resolve() / "mideas_konami8k_pipeline"
    )
    json_paths = resolve_json_paths(args)
    runner = project_root / "scripts" / "run_mideas_regression_matrix.py"

    cmd = [
        sys.executable,
        str(runner),
        "--project-root",
        str(project_root),
        "--artifact-dir",
        str(artifact_dir),
        "--modes",
        "megarom",
        "--target-formats",
        "konami",
        "--execution-mode",
        "interruptTaskManager",
        "--openmsx-timeout",
        str(args.openmsx_timeout),
        "--openmsx-smoke-romtype-modes",
        args.openmsx_smoke_romtype_modes,
        "--openmsx-smoke-require-movement",
        "--strict-p3-data-window",
        "--strict-vram-staging",
    ]

    if not args.fail_missing_json:
        cmd.append("--skip-missing-json")
    if args.no_openmsx_smoke:
        cmd.append("--no-openmsx-smoke")
    if args.strict_tilebank_integrity:
        cmd.append("--strict-tilebank-integrity")
    if args.strict_post_asm_no_dead_blocks:
        cmd.append("--strict-post-asm-no-dead-blocks")
    if args.post_asm_opt:
        cmd.append("--post-asm-opt")
    elif args.post_asm_check_only:
        cmd.append("--post-asm-check-only")
    if args.keep_going:
        cmd.append("--keep-going")
    if args.openmsx_path:
        cmd.extend(["--openmsx-path", args.openmsx_path])

    for json_path in json_paths:
        cmd.extend(["--json", str(json_path)])

    return cmd


def main() -> int:
    configure_stdio()
    args = parse_args()
    project_root = resolve_project_root(args.project_root)
    cmd = build_matrix_command(args, project_root)

    print("Konami 8K pipeline command:", flush=True)
    print(subprocess.list2cmdline(cmd), flush=True)

    if args.dry_run:
        return 0

    return subprocess.run(cmd, cwd=str(project_root)).returncode


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Konami 8K pipeline failed: {exc}", file=sys.stderr, flush=True)
        raise SystemExit(1)
