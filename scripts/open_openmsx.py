#!/usr/bin/env python3
"""Open a local ROM in OpenMSX with optional explicit ROM type."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

DEFAULT_50HZ_MACHINE = "C-BIOS_MSX1_EU"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Open a ROM file in OpenMSX.")
    parser.add_argument("--rom", required=True, help="Path to .rom file")
    parser.add_argument("--project-root", help="Project root for relative path resolution")
    parser.add_argument("--openmsx", help="Path to openmsx executable")
    parser.add_argument("--machine", default=DEFAULT_50HZ_MACHINE, help="Optional OpenMSX machine id")
    parser.add_argument("--romtype", help="Optional explicit OpenMSX ROM type, for example konami")
    parser.add_argument("--script", help="Optional TCL script to run at startup")
    parser.add_argument("--fullscreen", action="store_true", help="Start in fullscreen mode")
    parser.add_argument("--wait", action="store_true", help="Wait for emulator process to exit")
    parser.add_argument("--dry-run", action="store_true", help="Print command without launching")
    return parser.parse_args()


def resolve_openmsx(explicit: str | None) -> str:
    if explicit:
        explicit_path = Path(explicit).expanduser().resolve()
        if explicit_path.exists():
            return str(explicit_path)
        raise FileNotFoundError(f"OpenMSX executable not found: {explicit_path}")

    env_path = os.getenv("OPENMSX_PATH")
    if env_path:
        env_exec = Path(env_path).expanduser().resolve()
        if env_exec.exists():
            return str(env_exec)

    candidates = [
        Path(r"C:\Program Files\openMSX\openmsx.exe"),
        Path(r"C:\Program Files (x86)\openMSX\openmsx.exe"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate.resolve())

    which_exec = shutil.which("openmsx")
    if which_exec:
        return which_exec

    raise FileNotFoundError("OpenMSX not found. Use --openmsx or set OPENMSX_PATH.")


def resolve_existing_path(raw_path: str, project_root: Path) -> Path:
    raw = Path(raw_path).expanduser()
    candidates: list[Path] = []
    if raw.is_absolute():
        candidates.append(raw)
    candidates.extend([
        project_root / raw,
        Path.cwd() / raw,
    ])

    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved.exists():
            return resolved

    raise FileNotFoundError(f"File not found: {raw_path}")


def build_command(args: argparse.Namespace, project_root: Path) -> list[str]:
    openmsx_exec = resolve_openmsx(args.openmsx)
    rom_path = resolve_existing_path(args.rom, project_root)
    script_path = resolve_existing_path(args.script, project_root) if args.script else None

    cmd = [openmsx_exec]
    if args.machine:
        cmd.extend(["-machine", args.machine])
    cmd.extend(["-cart", str(rom_path)])
    if args.romtype:
        cmd.extend(["-romtype", args.romtype])
    if script_path:
        cmd.extend(["-script", str(script_path)])
    if args.fullscreen:
        cmd.append("-fullscreen")
    return cmd


def main() -> int:
    args = parse_args()
    project_root = (
        Path(args.project_root).expanduser().resolve()
        if args.project_root
        else Path.cwd().resolve()
    )

    try:
        cmd = build_command(args, project_root)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    print("Running:", " ".join(cmd))
    if args.dry_run:
        return 0

    if args.wait:
        completed = subprocess.run(cmd, cwd=str(project_root))
        return completed.returncode

    if os.name == "nt":
        creationflags = 0x00000008 | 0x00000200
        proc = subprocess.Popen(
            cmd,
            cwd=str(project_root),
            creationflags=creationflags,
            close_fds=True,
        )
    else:
        proc = subprocess.Popen(cmd, cwd=str(project_root), close_fds=True)

    print(f"OpenMSX launched (pid={proc.pid}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
