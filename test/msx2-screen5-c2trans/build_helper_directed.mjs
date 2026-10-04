// Directed OpenMSX regression of fast_copy_to_vram_chunked (C2-parche) v3.
// Implements the coverage Codex-030 asked on top of the accepted v2:
//   (1) guard AFTER the copy (incl. dst..dst+15 when len=0, and the 14-bit
//       wrap case: #F800+2048 wraps to bank offset 0 = VRAM #C000),
//   (2) display/IRQ variants: 4 passes = {display on,blank} x {EI,DI}; IFF is
//       captured before/after every helper call via `reg IFF`; pass 0 runs a
//       HALT probe so the IRQ-enabled mode is proven ACTIVE (H.TIMI stub
//       counts accepted interrupts); blank mode proven active by CNT frozen,
//   (3) zero-port-write proof for BC=0: breakpoints on every `out (nn),a`
//       inside the helper+vdp_write_register, armed only during case 0,
//   (4) deterministic sequence varying per byte AND per 256B block:
//       seq(k) = (base + 3k + 29*floor(k/256)) & 0xFF, recomputed in Tcl and
//       compared over the whole copied range (reordering/repetition detect).
//   Negative control: MUTATION=1 emits a corrupted helper (one extra 256B
//   chunk) that MUST fail the same instrument.
// Kept from v2 (Codex-029 fixes): AB header, all writable vars in RAM,
// zero-guarded fill, VRAM prefill+verify from the Tcl debugger, strict
// verdict (RESULT forced pending by instrument, DONE=#AA, exact counts).
// Usage: node test/msx2-screen5-c2trans/build_helper_directed.mjs [mutation]
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';

const MUT = process.argv[2] === 'mutation' || process.env.MUTATION === '1';
const SUFFIX = MUT ? '_neg' : '';
const out = path.resolve('test/msx2-screen5-c2trans');
const base = path.join(out, `chunked_helper_directed${SUFFIX}`);
const srcAsm = 'server/temp/msx2_bitmap_room_smoke_fg_fastcopy_patterns1k_unified.asm';
const full = fs.readFileSync(srcAsm, 'utf8');

function routine(text, label) {
  const start = text.indexOf(`\n${label}:`);
  if (start < 0) throw new Error(`missing ${label}`);
  const tail = text.slice(start + 1);
  const end = tail.slice(label.length + 1).search(/^\w[^\s:]*:/m);
  return end < 0 ? tail : tail.slice(0, label.length + 1 + end);
}
let chunked = routine(full, 'fast_copy_to_vram_chunked');
const vdp = routine(full, 'vdp_write_register');
if (MUT) {
  // Negative control: one extra 256B chunk on every nonempty copy -> must
  // overwrite the guard-after (and the wrap guard for #F800+2048).
  const anchor = '    ld d, b                   ; number of complete 256-byte chunks';
  if (!chunked.includes(anchor)) throw new Error('mutation anchor not found');
  chunked = chunked.replace(anchor, `${anchor}\n    inc d`);
}

// len / dst rotate through all four R#14 banks; #F800 is the real restore
// target. Dsts keep the dst-16 guard inside the same 16K segment.
const cases = [
  { len: 0, dst: 0x3000 }, { len: 1, dst: 0x7800 },
  { len: 255, dst: 0xB800 }, { len: 256, dst: 0xF800 },
  { len: 257, dst: 0x3000 }, { len: 512, dst: 0x7800 },
  { len: 1024, dst: 0xB800 }, { len: 2048, dst: 0xF800 },
];
cases.forEach((c, i) => {
  c.pattern = (i * 7 + 3) & 0xFF;           // kept for poison derivation
  c.poison = c.pattern ^ 0xFF;
  c.base = (i * 17 + 5) & 0xFF;             // seq(0); seq(k)=base+3k+29*(k>>8)
  const bank = c.dst & 0xC000;
  c.guardAfter = [];
  for (let k = 0; k < 16; k++) c.guardAfter.push(bank + ((c.dst + c.len - bank + k) & 0x3FFF));
});
const passes = [
  // Driver encodes: display on when bit0=0 (p0,p2), EI when bit1=0 (p0,p1).
  // V9938 note: BL=0 blanks video but the retrace interrupt keeps firing, so
  // blank-mode-active is proven by the per-pass VDP diff pinning R1=0x20,
  // not by CNT. DI passes (p2,p3) must keep CNT frozen (any EI would move it).
  { id: 0, displayOn: true, ei: true, note: 'display+EI: HALT probe, CNT must grow' },
  { id: 1, displayOn: false, ei: true, note: 'blank+EI: R1=0x20 pinned by VDP diff' },
  { id: 2, displayOn: true, ei: false, note: 'display+DI: CNT frozen' },
  { id: 3, displayOn: false, ei: false, note: 'blank+DI: CNT frozen' },
];

const RESULT = 0xC000, DONE = 0xC001, SAVIX = 0xC002, SAVIY = 0xC004,
  PAT = 0xC006, LEN = 0xC007, DST = 0xC009, PASSN = 0xC00B, CNT = 0xC00C,
  STUB = 0xC010, SRC = 0xC100;
const w = (n) => `#${n.toString(16).toUpperCase()}`;

// One unrolled case block, executed once per pass (4x).
let code = '';
for (const [c, cs] of cases.entries()) {
  code += `    ld a, (PASSN)\n    sla a\n    sla a\n    sla a\n    sla a\n    or ${128 + c}\n    call checkpoint\n`;
  code += `    ld a, ${cs.base}\n    ld bc, ${cs.len}\n    ld de, ${w(cs.dst)}\n    call run_case\n`;
  code += `    ld a, (PASSN)\n    sla a\n    sla a\n    sla a\n    sla a\n    or ${c}\n    call checkpoint\n`;
}

const asm = `org #4000
db #41,#42
dw init,0,0,0,0,0,0
init:
    di
    ld sp, #F000
    ld a, 5
    call #005F
    di
    ld hl, stub_code
    ld de, ${w(STUB)}
    ld bc, stub_end - stub_code
    ldir
    ; Hook cells hold CODE: write JP #C010 (C3 10 C0) into LTIMI/H.TIMI.
    ld a, #C3
    ld (#FD9A), a
    ld (#FD9F), a
    ld hl, ${w(STUB)}
    ld (#FD9B), hl
    ld (#FDA0), hl
    ld a, #FF
    ld (DONE), a
    ld a, 238
    ld (RESULT), a
    xor a
    ld (CNT), a
    ld (CNT+1), a
    ld (PASSN), a
pass_loop:
    call pass_setup
${code}    ld a, (PASSN)
    inc a
    ld (PASSN), a
    cp 4
    jp nz, pass_loop
    ld a, #AA
    ld (DONE), a
finished:
    jp finished
checkpoint:
    ret
stub_code:
    push hl
    ld hl, (CNT)
    inc hl
    ld (CNT), hl
    pop hl
    ret
stub_end:
pass_setup:
    ld a, (PASSN)
    and #01
    jr nz, .blank
    ld a, #60
    jr .wr
.blank:
    ld a, #20
.wr:
    out (#99), a
    ld a, #81
    out (#99), a
    ld a, 2
    out (#99), a
    ld a, #8E
    out (#99), a
    ld a, (PASSN)
    and #02
    jr nz, .dip
    ei
    jr .eid
.dip:
    di
.eid:
    ld a, (PASSN)
    or a
    ret nz
    halt
    ret
run_case:
    ld (PAT), a
    ld (LEN), bc
    ld (DST), de
    ld a, 238
    ld (RESULT), a
    ld hl, ${w(SRC)}
    ld bc, (LEN)
    ld a, (PAT)
    ld e, a
    ld d, 0
.fill:
    ld a, b
    or c
    jr z, .copy
    ld a, e
    ld (hl), a
    inc hl
    ld a, e
    add a, 3
    inc d
    jr nz, .nb
    add a, 29
.nb:
    ld e, a
    dec bc
    jr .fill
.copy:
    ld hl, ${w(SRC)}
    ld de, (DST)
    ld bc, (LEN)
    ld (${w(SAVIX)}), ix
    ld (${w(SAVIY)}), iy
    call fast_copy_to_vram_chunked
    push ix
    pop hl
    ld de, (${w(SAVIX)})
    ld a, h
    xor d
    jr nz, .badix
    ld a, l
    xor e
    jr nz, .badix
    push iy
    pop hl
    ld de, (${w(SAVIY)})
    ld a, h
    xor d
    jr nz, .badiy
    ld a, l
    xor e
    jr nz, .badiy
    xor a
    jr .store
.badix:
    ld a, 1
    jr .store
.badiy:
    ld a, 2
.store:
    ld (RESULT), a
    ret
RESULT EQU ${w(RESULT)}
DONE EQU ${w(DONE)}
SAVIX EQU ${w(SAVIX)}
SAVIY EQU ${w(SAVIY)}
PAT EQU ${w(PAT)}
LEN EQU ${w(LEN)}
DST EQU ${w(DST)}
PASSN EQU ${w(PASSN)}
CNT EQU ${w(CNT)}
SRC EQU ${w(SRC)}
${chunked}
${vdp}
ds #C000-$,#FF
`.replace(/^(org|db|dw|ds) /gm, '    $1 ');

fs.writeFileSync(base + '.asm', asm);
execFileSync('java', ['-jar', 'server/glass.jar', base + '.asm', base + '.rom', base + '.sym']);
const sym = fs.readFileSync(base + '.sym', 'utf8');
const addr = (label) => {
  const m = sym.match(new RegExp(`^${label}: equ ([0-9A-F]+)H`, 'm'));
  if (!m) throw new Error(`symbol not found: ${label}`);
  return parseInt(m[1], 16);
};
for (const l of ['init', 'checkpoint', 'pass_setup', 'run_case', 'finished',
  'fast_copy_to_vram_chunked', 'vdp_write_register']) addr(l);

// Port-write counting (item 3): every `out (nn),a` (D3 98/99) inside the
// helper and vdp_write_register gets a breakpoint.
const rom = fs.readFileSync(base + '.rom');
const hStart = addr('fast_copy_to_vram_chunked');
const vStart = addr('vdp_write_register');
const vEnd = vStart + 12;
const outSites = [];
for (let a = hStart; a < vEnd; a++) {
  if (rom[a - 0x4000] === 0xD3 && (rom[a - 0x4000 + 1] === 0x98 || rom[a - 0x4000 + 1] === 0x99)) {
    outSites.push(a);
  }
}
if (outSites.length !== 4) throw new Error(`expected 4 out sites, got ${outSites.length}: ${outSites.map(a => a.toString(16)).join(',')}`);

const tclCases = cases.map(c => `[list ${c.dst} ${c.len} ${c.poison} ${c.base} {${c.guardAfter.join(' ')}}]`).join(' ');
const outBps = outSites.map(a => `debug set_bp ${a} {} { if {$::armed} { incr ::pw }; debug cont }`).join('\n');const tcl = `# Directed regression of fast_copy_to_vram_chunked (C2-parche) v3${MUT ? ' - NEGATIVE CONTROL (mutated helper)' : ''}.
# Source build asm sha256: ${createHash('sha256').update(full).digest('hex')}
# Driver ROM sha256: ${createHash('sha256').update(rom).digest('hex')}
set f [open "${base.replaceAll('\\', '/')}.txt" w]
set throttle off
set failures 0
set boots 0
set prefills 0
set verifies 0
set armed 0
set pw 0
set cnt_start [lrepeat 4 0]
set cnt_end [lrepeat 4 0]
array set basereg {}
set cases [list ${tclCases}]
proc check {yes msg} { if {!$yes} { incr ::failures; puts $::f "FAIL $msg"; flush $::f } }
proc regsnap {} {
  set s {}
  for {set r 0} {$r < 24} {incr r} { lappend s [debug read {VDP regs} $r] }
  return $s
}
proc seqval {base k} { return [expr {($base + 3*$k + 29*($k/256)) % 256}] }
proc cntval {} {
  set lo [debug read memory ${CNT}]
  set hi [debug read memory [expr {${CNT}+1}]]
  return [expr {$hi*256 + $lo}]
}
proc passmode {p} { return [expr {$p <= 1 ? 7 : 0}] }
proc prefill {p c} {
  set cc [lindex $::cases $c]
  set dst [lindex $cc 0]
  set len [lindex $cc 1]
  set poi [lindex $cc 2]
  set ga [lindex $cc 4]
  incr ::prefills
  if {![info exists ::basereg($p)]} { set ::basereg($p) [regsnap] }
  lset ::cnt_start $p [cntval]
  debug write memory ${RESULT} 238
  for {set k 1} {$k <= 16} {incr k} { debug write VRAM [expr {$dst-$k}] $poi }
  for {set k 0} {$k < $len} {incr k} { debug write VRAM [expr {$dst+$k}] $poi }
  foreach a $ga { debug write VRAM $a $poi }
  if {$c == 0} { set ::armed 1 }
}
proc verify {p c} {
  set cc [lindex $::cases $c]
  set dst [lindex $cc 0]
  set len [lindex $cc 1]
  set poi [lindex $cc 2]
  set bs [lindex $cc 3]
  set ga [lindex $cc 4]
  incr ::verifies
  set res [debug read memory ${RESULT}]
  check [expr {$res == 0}] "p$p c$c RESULT=$res (0 ok 1 ix 2 iy 238 unreached)"
  if {$c == 0} {
    check [expr {$::armed == 1}] "p$p c0 armed flag lost"
    set ::armed 0
    check [expr {$::pw == 0}] "p$p c0 port writes during BC=0 helper: $::pw"
  }
  set iff [reg IFF]
  check [expr {$iff == [passmode $p]}] "p$p c$c IFF=$iff want [passmode $p] after helper"
  set bad 0
  for {set k 0} {$k < $len} {incr k} {
    if {[debug read VRAM [expr {$dst+$k}]] != [seqval $bs $k]} {
      incr bad
      if {$bad <= 20} { puts $::f "FAIL p$p c$c byte +$k got [debug read VRAM [expr {$dst+$k}]] want [seqval $bs $k]" }
    }
  }
  check [expr {$bad == 0}] "p$p c$c copy mismatches=$bad/$len"
  set badg 0
  for {set k 1} {$k <= 16} {incr k} {
    if {[debug read VRAM [expr {$dst-$k}]] != $poi} { incr badg }
  }
  check [expr {$badg == 0}] "p$p c$c guard-below mismatches=$badg/16"
  set bada 0
  foreach a $ga {
    if {[debug read VRAM $a] != $poi} { incr bada }
  }
  check [expr {$bada == 0}] "p$p c$c guard-after mismatches=$bada/16"
  set r14 [debug read {VDP regs} 14]
  if {$len == 0} {
    check [expr {$r14 == 2}] "p$p c$c R14=$r14 want 2 (BC=0 must not touch R14)"
  } else {
    check [expr {$r14 == 0}] "p$p c$c R14=$r14 want 0"
  }
  set cur [regsnap]
  for {set r 0} {$r < 24} {incr r} {
    set b [lindex $::basereg($p) $r]
    set v [lindex $cur $r]
    if {$b != $v && !($r == 14 && $len > 0 && $v == 0)} {
      check [expr {0}] "p$p c$c VDP R#$r changed $b -> $v"
    }
  }
  if {$c == 7} { lset ::cnt_end $p [cntval] }
  puts $::f "CASE p$p c$c len=$len dst=[format %04X $dst] RESULT=$res IFF=$iff R14=$r14 leftover BC=[format %04X [reg BC]]"
  flush $::f
}
${outBps}
debug set_bp ${addr('init')} {} { incr ::boots; puts $::f "INIT-HIT boots=$::boots"; flush $::f; debug cont }
debug set_bp ${addr('checkpoint')} {} {
  if {[catch {
    set a [reg A]
    set i [expr {$a & 127}]
    set p [expr {$i >> 4}]
    set c [expr {$i & 15}]
    if {$a >= 128} { puts $::f "PREFILL p$p c$c"; flush $::f; prefill $p $c } else { puts $::f "VERIFY p$p c$c"; flush $::f; verify $p $c }
  } e]} { incr ::failures; puts $::f "ERROR $e"; flush $::f }
  debug cont
}
debug set_bp ${addr('finished')} {} {
  if {[catch {
    set done [debug read memory ${DONE}]
    check [expr {$done == 170}] "DONE=$done (want 170=#AA; else run not completed)"
    check [expr {$::verifies == ${cases.length * passes.length}}] "verifies=$::verifies want ${cases.length * passes.length}"
    check [expr {$::prefills == ${cases.length * passes.length}}] "prefills=$::prefills want ${cases.length * passes.length}"
    check [expr {$::boots == 1}] "boots=$::boots"
    check [expr {[lindex $::cnt_end 0] > [lindex $::cnt_start 0]}] "pass0 IRQ mode not proven active: cnt [lindex $::cnt_start 0] -> [lindex $::cnt_end 0]"
    foreach p {2 3} {
      check [expr {[lindex $::cnt_start $p] == [lindex $::cnt_end $p]}] "pass$p CNT moved [lindex $::cnt_start $p] -> [lindex $::cnt_end $p] (DI mode not clean)"
    }
    check [expr {$::pw == 0}] "residual port writes: $::pw"
  } e]} { incr ::failures; puts $::f "ERROR $e" }
  puts $::f "verifies=$::verifies prefills=$::prefills boots=$::boots pw=$::pw cnt=[lindex $::cnt_start 0]/[lindex $::cnt_end 0] failures=$::failures"
  puts $::f [expr {$::failures == 0 ? "VERDICT: PASS" : "VERDICT: FAIL"}]
  puts $::f "RUN-COMPLETE"
  close $::f
  exit
}
after time 60 { puts $::f "VERDICT: FAIL timeout"; close $::f; exit }
`;
fs.writeFileSync(base + '.tcl', tcl);

const meta = {
  purpose: `Directed regression of fast_copy_to_vram_chunked (C2-parche) v3${MUT ? ' - NEGATIVE CONTROL' : ''}`,
  mutation: MUT ? 'ld d,b followed by inc d -> one extra 256B chunk per nonempty copy' : null,
  sourceBuildAsm: srcAsm,
  sourceBuildAsmSha256: createHash('sha256').update(full).digest('hex'),
  generatorTsSha256: createHash('sha256')
    .update(fs.readFileSync('utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator.ts'))
    .digest('hex'),
  cases, passes, outSites,
  ram: { RESULT, DONE, SAVIX, SAVIY, PAT, LEN, DST, PASSN, CNT, STUB, SRC },
  files: ['asm', 'rom', 'sym', 'tcl'].map(ext => ({
    ext, sha256: createHash('sha256').update(fs.readFileSync(base + '.' + ext)).digest('hex'),
  })),
};
fs.writeFileSync(base + '.json', JSON.stringify(meta, null, 2));
console.log(`directed v3${MUT ? ' (NEGATIVE CONTROL)' : ''}: ${cases.length}x${passes.length} runs, ` +
  `${fs.statSync(base + '.rom').size} bytes, out-sites=${outSites.map(a => a.toString(16)).join(',')}`);
