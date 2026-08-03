#!/usr/bin/env python3
"""Map raw Z80 addresses to the nearest preceding Glass symbol."""
import re
import sys
from pathlib import Path

sym_path = Path(sys.argv[1])
targets = [int(a, 16) for a in sys.argv[2:]]
syms = {}
pattern = re.compile(r"^(\S+?):?\s+equ\s+([0-9A-Fa-f]+)H\s*$")
for line in sym_path.read_text(encoding="utf-8", errors="replace").splitlines():
    match = pattern.match(line.strip())
    if match:
        syms.setdefault(int(match.group(2), 16), []).append(match.group(1))
for target in targets:
    below = [addr for addr in syms if addr <= target]
    if not below:
        print(f"{target:04X} -> ?")
        continue
    best = max(below)
    print(f"{target:04X} -> {'/'.join(syms[best])} +{target - best}")
