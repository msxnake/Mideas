#!/usr/bin/env python3
"""Repo-local wrapper for the Codex skill script open_openmsx.py."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

DEFAULT_50HZ_MACHINE = "C-BIOS_MSX1_EU"


def _codex_roots() -> list[Path]:
    roots: list[Path] = []
    codex_home = os.environ.get("CODEX_HOME")
    if codex_home:
        roots.append(Path(codex_home))
    userprofile = os.environ.get("USERPROFILE")
    if userprofile:
        roots.append(Path(userprofile) / ".codex")
    home_codex = Path.home() / ".codex"
    if home_codex not in roots:
        roots.append(home_codex)
    return roots


def _resolve_target() -> Path | None:
    rel = Path("skills") / "abrir-openmsx-rom" / "scripts" / "open_openmsx.py"
    for root in _codex_roots():
        candidate = root / rel
        if candidate.exists():
            return candidate
    return None


def main() -> int:
    target = _resolve_target()
    if target is None:
        print("Error: skill script not found: abrir-openmsx-rom/scripts/open_openmsx.py", file=sys.stderr)
        print("Checked CODEX_HOME, USERPROFILE/.codex and ~/.codex", file=sys.stderr)
        return 1
    forwarded_args = list(sys.argv[1:])
    if "--machine" not in forwarded_args:
        forwarded_args.extend(["--machine", DEFAULT_50HZ_MACHINE])
    cmd = [sys.executable, str(target), *forwarded_args]
    return subprocess.run(cmd).returncode


if __name__ == "__main__":
    raise SystemExit(main())
