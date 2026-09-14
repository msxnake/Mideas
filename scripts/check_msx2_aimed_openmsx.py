"""Exercise the actual generated aimed-vector Z80 in a directed OpenMSX ROM.

Usage: python scripts/check_msx2_aimed_openmsx.py --asm work/aimed_precise.asm
The shadow-table reader is isolated with its documented clobbers; vector and
scale instructions and the normalisation table are extracted without edits.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import random
import re
import subprocess

p = argparse.ArgumentParser()
p.add_argument('--asm', required=True)
p.add_argument('--out', default='work/aimed-vector-test')
p.add_argument('--openmsx', default='C:/Program Files/openMSX/openmsx.exe')
args = p.parse_args()
root = Path(__file__).resolve().parents[1]
source = Path(args.asm).resolve().read_text(encoding='utf-8')
out = Path(args.out).resolve()
out.mkdir(parents=True, exist_ok=True)
vector = source.split('bitmap_boss_aim_vector:\n', 1)[1].split('; Which of the 16', 1)[0]
scale = source.split('bitmap_boss_shoot_scale:\n', 1)[1].split('; ------------------------------------------------------------', 1)[0]
table = source.split('bitmap_boss_aim_unit_table:\n', 1)[1].split('; (row =', 1)[0]
ox, oy = [int(v) for v in re.findall(r'ld bc, (\d+)\s*\n    add hl, bc', vector)]
asm = '''    org #4000
    db #41,#42
    dw entry
    ds 12,0
entry:
    di
    ld sp,#F000
ready:
    nop
    call bitmap_boss_aim_vector
capture:
    nop
    jp ready
boss_x equ #C000
boss_y equ #C001
player_x equ #C002
player_y equ #C003
boss_shoot_spd equ #C004
boss_sbul_dxf equ #C005
boss_sbul_dyf equ #C006
; Isolated table-reader ABI: BC/IX/IY preserved, AF/DE/HL destroyed.
bitmap_boss_table_ix_shadow:
    ld de,13
    ld hl,#C020
    xor a
    ret
bitmap_boss_aim_vector:
''' + vector + '\nbitmap_boss_shoot_scale:\n' + scale + '\nbitmap_boss_aim_unit_table:\n' + table
(out / 'directed.asm').write_text(asm, encoding='utf-8')
subprocess.run(['java', '-jar', str(root / 'server/glass.jar'), str(out / 'directed.asm'), str(out / 'directed.rom'), str(out / 'directed.sym')], check=True)
rom = (out / 'directed.rom').read_bytes()
(out / 'directed.rom').write_bytes(rom + b'\xff' * (32768-len(rom)))
symbols = {m[1]: int(m[2], 16) for m in re.finditer(r'^(\w+): equ ([0-9A-F]+)H', (out / 'directed.sym').read_text(), re.M)}
cases = []
# All quadrants, exact axes/diagonals, near axes, long shots, coincident
# centres, overflow at both body centres, and all supported speeds.
for speed in range(1, 5):
    for px in [0, 1, 7, 31, 63, 95, 127, 191, 238, 255]:
        for py in [0, 1, 17, 63, 95, 127, 175, 191, 255]:
            cases.append([96, 64, 32, 32, px, py, speed])
    cases.append([96, 64, 32, 32, 112-ox, 80-oy, speed])
    cases.append([250, 250, 32, 32, 0, 0, speed])
    for dx, dy in [(1, 1), (30, 30), (-30, 30), (30, -30), (-30, -30), (1, 90), (90, 1), (0, 70), (70, 0)]:
        cases.append([96, 64, 32, 32, 112+dx-ox, 80+dy-oy, speed])
rng = random.Random(607)
for _ in range(600):
    cases.append([rng.randrange(256), rng.randrange(256), rng.randrange(1, 128), rng.randrange(1, 128), rng.randrange(256), rng.randrange(256), rng.randrange(1, 5)])
(out / 'cases.json').write_text(json.dumps(cases), encoding='utf-8')
tcl_cases = '\n'.join('{' + ' '.join(map(str, c)) + '}' for c in cases)
tcl = '''set throttle off
set ::f [open "LOG" w]
set ::cases {CASES}
set ::n 0
set ::failures 0
set ::maxmiss 0.0
set ::maxspeederr 0.0
set ::maxus 0.0
proc mem {a} { debug read memory $a }
proc prepare {} {
    set c [lindex $::cases $::n]
    lassign $c bx by bw bh px py speed
    foreach a {0xC000 0xC001 0xC020 0xC021 0xC002 0xC003 0xC004} v $c { debug write memory $a $v }
    reg IX 0x1234
    reg IY 0x5678
    set ::started [machine_info time]
    if {$::n == 0} { puts $::f "START sp=[reg SP] speed=[mem 0xC004]"; flush $::f }
    debug cont
}
proc aimed_check {} {
    lassign [lindex $::cases $::n] bx by bw bh px py speed
    set dx [expr {$px+OX-($bx+($bw/2))}]
    set dy [expr {$py+OY-($by+($bh/2))}]
    if {$dx == 0 && $dy == 0} { set dy 1 }
    set vx [expr {([reg D] >= 128 ? [reg D]-256 : [reg D])*256+[mem 0xC005]}]
    set vy [expr {([reg E] >= 128 ? [reg E]-256 : [reg E])*256+[mem 0xC006]}]
    set norm [expr {sqrt(double($vx*$vx+$vy*$vy))}]
    set miss [expr {abs(double($vx*$dy-$vy*$dx))/$norm}]
    set speederr [expr {abs($norm/256.0-$speed)/$speed}]
    set us [expr {([machine_info time]-$::started)*1000000}]
    if {$miss > $::maxmiss} { set ::maxmiss $miss }
    if {$speederr > $::maxspeederr} { set ::maxspeederr $speederr }
    if {$us > $::maxus} { set ::maxus $us }
    set ok [expr {$miss < 1.0 && $speederr < 0.005 && $vx*$dx+$vy*$dy > 0 && [reg IX]==0x1234 && [reg IY]==0x5678 && [reg SP]==0xF000}]
    if {!$ok} { incr ::failures }
    puts $::f "CASE $::n ok=$ok rel=$dx,$dy velocity=$vx,$vy miss=$miss speederr=$speederr us=$us"
    flush $::f
    incr ::n
    if {$::n == [llength $::cases]} {
        puts $::f "RESULT cases=$::n failures=$::failures maxMissPx=$::maxmiss maxSpeedError=$::maxspeederr maxUs=$::maxus"
        close $::f
        exit
    }
    debug cont
}
debug set_bp READY {} {prepare}
debug set_bp CAPTURE {} {if {[catch {aimed_check} err]} { puts $::f "FAIL callback: $err DE=[reg DE] SP=[reg SP]"; close $::f; exit }}
after time 8 { puts $::f "FAIL timeout pc=[reg PC] sp=[reg SP] header=[mem 0x4000] n=$::n"; close $::f; exit }
'''.replace('LOG', (out / 'results.txt').as_posix()).replace('CASES', tcl_cases).replace('OX', str(ox)).replace('OY', str(oy)).replace('READY', str(symbols['ready'])).replace('CAPTURE', str(symbols['capture']))
(out / 'directed.tcl').write_text(tcl, encoding='utf-8')
with (out / 'openmsx.log').open('w') as log:
    subprocess.run([args.openmsx, '-machine', 'C-BIOS_MSX2', '-cart', str(out / 'directed.rom'), '-script', str(out / 'directed.tcl')], stdout=log, stderr=subprocess.STDOUT, timeout=90)
results = (out / 'results.txt').read_text()
print(results.splitlines()[-1])
(out / 'sha256.json').write_text(json.dumps({name: hashlib.sha256((out / name).read_bytes()).hexdigest() for name in ['directed.asm', 'directed.rom', 'directed.sym', 'directed.tcl', 'results.txt', 'cases.json']}, indent=2))
if 'failures=0 ' not in results or 'FAIL timeout' in results:
    raise SystemExit('Aimed vector OpenMSX validation failed')
