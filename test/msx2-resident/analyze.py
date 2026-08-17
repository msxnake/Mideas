"""Ranks what is eating the SCREEN 5 bitmap 32KB resident window (#4000-#BFFF).

When Glass dies with `Negative initial size: -N`, the resident block overflowed by
N bytes: the generator emits it as one stream from `org #4000` and pads it with
`ds #C000 - $`. This neutralises that padding so Glass completes, takes the symbol
table, and attributes bytes to each label.

Two things it gets right that a naive pass does not:
  - Data banks are ALSO org'd at #8000, so residency is decided by position in the
    ASM (before the padding line), never by address.
  - A label is only movable to a bank if its body is pure DB/DW/DS. GameFlow nodes
    look like data and are actually code.

It also reports, for each candidate, whether its readers sit inside the #8000-#9FFF
window, because those cannot map their own bank without unmapping themselves.

Usage: python test/msx2-resident/analyze.py <generated.asm> [glass.jar]
"""
import io, re, subprocess, sys
from pathlib import Path

asm_path = Path(sys.argv[1]).resolve()
glass = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else asm_path.parents[2] / 'server' / 'glass.jar'
work = asm_path.parent
probe_asm, probe_rom, probe_sym = work / '_probe.asm', work / '_probe.rom', work / '_probe.sym'

text = io.open(asm_path, encoding='utf-8', errors='replace').read()
patched, hits = re.subn(r'ds #C000 - \$, #FF', 'ds 0, #FF', text, count=1)
if not hits:
    sys.exit('No `ds #C000 - $` padding found: is this a MegaROM bitmap-room ASM?')
io.open(probe_asm, 'w', encoding='utf-8').write(patched)
subprocess.run(['java', '-jar', str(glass), '-I', str(glass.parent),
                str(probe_asm), str(probe_rom), str(probe_sym)], check=True,
               capture_output=True)

lines = patched.split('\n')
resident_end = next(i for i, l in enumerate(lines) if l.strip().startswith('ds 0, #FF'))
syms = {}
for line in io.open(probe_sym, encoding='utf-8', errors='replace'):
    m = re.match(r'^([^\s:]+):\s*equ\s+([0-9A-Fa-f]+)H\s*$', line.strip())
    if m and not m.group(1).startswith('.'):
        syms[m.group(1)] = int(m.group(2), 16)
equ = {m.group(1) for m in (re.match(r'^([A-Za-z_][\w]*)\s+EQU\s', l, re.I) for l in lines) if m}
tops = [(i, m.group(1)) for i, l in enumerate(lines[:resident_end])
        for m in [re.match(r'^([A-Za-z_][\w]*):', l)] if m]
label_line = {}
for i, n in tops:
    label_line.setdefault(n, i)
res = sorted((label_line[n], syms[n], n) for n in label_line if n in syms and n not in equ)

def pure_data(a, b):
    body = 0
    for l in lines[a + 1:b]:
        s = l.strip()
        if not s or s.startswith(';'):
            continue
        if re.match(r'^(db|dw|ds)\b', s, re.I):
            body += 1
        else:
            return False
    return body > 0

def enclosing(ln):
    prev = None
    for i, n in tops:
        if i > ln:
            break
        prev = n
    return prev

end_addr = res[-1][1] if res else 0xC000
items = []
code_bytes = 0
for i, (ln, addr, name) in enumerate(res):
    nxt_addr = res[i + 1][1] if i + 1 < len(res) else end_addr
    nxt_line = res[i + 1][0] if i + 1 < len(res) else resident_end
    size = nxt_addr - addr
    if size < 0:
        continue
    if pure_data(ln, nxt_line):
        items.append((size, addr, name, ln, nxt_line))
    else:
        code_bytes += size

over = max(0, (end_addr - 0x4000) - 0x8000)
print('RESIDENTE #4000..#%04X = %d bytes (limite 32768)' % (end_addr, end_addr - 0x4000))
print('  exceso            : %d bytes' % over)
print('  codigo (se queda) : %d bytes' % code_bytes)
print('  datos (bancables) : %d bytes\n' % sum(i[0] for i in items))
print('  bytes  simbolo                              lectores')
for size, addr, name, ln, nxt_line in sorted(items, reverse=True)[:18]:
    readers = set()
    for i, l in enumerate(lines[:resident_end]):
        if re.search(r'\b' + re.escape(name) + r'\b', l) and not l.startswith(name + ':'):
            e = enclosing(i)
            if e and e != name:
                readers.add(e)
    tags = []
    for r in sorted(readers):
        a = syms.get(r)
        tags.append('%s%s' % (r, '!P2' if a and 0x8000 <= a < 0xA000 else ''))
    print('  %5d  %-38s %s' % (size, name, ', '.join(tags[:3]) or '(via tabla)'))
print('\n  !P2 = el lector vive en #8000-#9FFF y no puede mapear su propio banco')
