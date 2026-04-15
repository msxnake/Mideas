#!/usr/bin/env python3
"""Repo-local wrapper for the Codex skill script compile_glass.py."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from typing import Sequence


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
    rel = Path("skills") / "compilar-con-glass-jar" / "scripts" / "compile_glass.py"
    for root in _codex_roots():
        candidate = root / rel
        if candidate.exists():
            return candidate
    return None


def _append_default_includes(argv: Sequence[str]) -> list[str]:
    args = list(argv)
    source_path: Path | None = None
    explicit_project_root: Path | None = None
    includes: set[str] = set()

    i = 0
    while i < len(args):
        token = args[i]
        if token == "--include" and i + 1 < len(args):
            includes.add(str(Path(args[i + 1]).expanduser().resolve()))
            i += 2
            continue
        if token == "--source" and i + 1 < len(args):
            source_path = Path(args[i + 1]).expanduser().resolve()
            i += 2
            continue
        if token == "--project-root" and i + 1 < len(args):
            explicit_project_root = Path(args[i + 1]).expanduser().resolve()
            i += 2
            continue
        i += 1

    extra_args: list[str] = []

    def maybe_add_include(candidate: Path) -> None:
        resolved = candidate.expanduser().resolve()
        if not resolved.exists() or not resolved.is_dir():
            return
        key = str(resolved)
        if key in includes:
            return
        includes.add(key)
        extra_args.extend(["--include", key])

    if source_path is not None:
        maybe_add_include(source_path.parent)
    if explicit_project_root is not None:
        maybe_add_include(explicit_project_root / "server")

    return [*args, *extra_args]


def main() -> int:
    target = _resolve_target()
    if target is None:
        print("Error: skill script not found: compilar-con-glass-jar/scripts/compile_glass.py", file=sys.stderr)
        print("Checked CODEX_HOME, USERPROFILE/.codex and ~/.codex", file=sys.stderr)
        return 1
    forwarded_args = _append_default_includes(sys.argv[1:])
    cmd = [sys.executable, str(target), *forwarded_args]
    return subprocess.run(cmd).returncode


if __name__ == "__main__":
    raise SystemExit(main())
