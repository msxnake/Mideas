#!/usr/bin/env node
// Generate the enemy colour cache OpenMSX probe v6 (CONTRATO B).
// Independent oracle: a breakpoint on each .color_slot_N_done fires right
// after that slot's colour step inside bitmap_update_enemy_colors. There the
// expected colour block is computed INDEPENDENTLY from the pool state
// (colorOff + animFrame; this fixture has no slime/darkEyes terms), and both
// the cache key/valid and the 16 VRAM bytes are verified against the ROM
// colours table — the key is never used as the oracle.
// Usage: node test/msx2-screen5-enemy-cache/build_probe.mjs <post|pre> [rom sym asm]
import fs from 'fs';
import { createHash } from 'node:crypto';

const target = process.argv[2] || 'post';
const overrides = { rom: process.argv[3], sym: process.argv[4], asm: process.argv[5] };
const romPath = overrides.rom || (target === 'post'
  ? 'work/enemy-cache-game-v6/post.rom'
  : 'work/enemy-cache-game-v6/pre.rom');
const symPath = overrides.sym || (target === 'post'
  ? 'work/enemy-cache-game-v6/post.sym'
  : 'work/enemy-cache-game-v6/pre.sym');
const asmPath = overrides.asm || (target === 'post'
  ? 'work/enemy-cache-game-v6/post.asm'
  : 'work/enemy-cache-game-v6/pre.asm');
const hasCache = target === 'post';
const negative = process.env.CACHE_NEGATIVE === '1';
if (negative && !hasCache) throw new Error('negative probe requires post build');
const runName = `${target}${negative ? '_invalid' : ''}_v6`;

const sym = fs.readFileSync(symPath, 'utf8');
const symAddr = (label) => {
  const m = sym.match(new RegExp(`^${label.replace(/\./g, '\\.')}: equ ([0-9A-F]+H)`, 'm'));
  if (!m) throw new Error(`symbol not found: ${label}`);
  return parseInt(m[1], 16);
};
const rom = fs.readFileSync(romPath);
const init = rom.readUInt16LE(2); // 'AB' header INIT

const countAddr = symAddr('bitmap_enemy_count');
const poolAddr = symAddr('bitmap_enemy_pool');
const colorsRom = symAddr('bitmap_enemy_sprite_colors');
const idxAddr = symAddr('current_screen_index');
// Cache equates only exist in the patched build; 0 placeholders for baseline.
const hasCacheSyms = /bitmap_enemy_color_keys: equ /.test(sym);
const keysAddr = hasCacheSyms ? symAddr('bitmap_enemy_color_keys') : 0;
const validAddr = hasCacheSyms ? symAddr('bitmap_enemy_color_valid') : 0;
const asm = fs.readFileSync(asmPath, 'utf8');
const slots = [...new Set([...asm.matchAll(/^\.color_slot_(\d+)_done:/gm)].map(m => parseInt(m[1], 10)))];
if (!slots.length) throw new Error('no .color_slot_N_done labels in sym');
const poolStride = parseInt(asm.match(/ENEMY runtime state \(\d+ bytes\): count \+ \d+ slot\(s\) x (\d+)/)?.[1] || '30', 10);

// Expected-colour oracle bytes come from the ASM colours table (source of
// truth; the live #8000 window is a dynamic bank in banked builds).
const tblStart = asm.indexOf('bitmap_enemy_sprite_colors:');
const tblEnd = asm.indexOf('bitmap_enemy_sprite_colors_end:', tblStart);
if (tblStart === -1 || tblEnd === -1) throw new Error('colours table labels not found in ASM');
const colTable = [];
for (const m of asm.slice(tblStart, tblEnd).matchAll(/#([0-9A-F]{2})/gi)) colTable.push(parseInt(m[1], 16));
if (!colTable.length) throw new Error('colours table is empty');
const slot0Start = asm.indexOf('.color_slot_0_upload:') !== -1
  ? asm.indexOf('.color_slot_0_upload:')
  : asm.indexOf('.color_slot_0:');
const block0 = asm.slice(slot0Start, asm.indexOf('.color_slot_0_done:'));
const colorBase = (block0.match(/ld de, #([0-9A-F]{4})/) || [])[1];
if (!colorBase) throw new Error('could not extract enemy colorBase from generated ASM');

const doneBps = slots.map(s => {
  const a = symAddr(`.color_slot_${s}_done`);
  return `debug set_bp 0x${a.toString(16).toUpperCase()} {} { done_slot ${s} ; debug cont }`;
}).join('\n');
const uploadBps = hasCache ? slots.map(s => {
  const a = symAddr(`.color_slot_${s}_upload`);
  return `debug set_bp 0x${a.toString(16).toUpperCase()} {} { incr ::up(${s}) ; debug cont }`;
}).join('\n') : '';
const evalBp = `debug set_bp 0x${symAddr('bitmap_enemy_colors_offset').toString(16).toUpperCase()} {} { incr ::evals ; debug cont }`;

const tcl = `# Enemy colour cache probe v6 (CONTRATO B) — build ${target}.
# Independent oracle at .color_slot_N_done: expected block = (colorOff + animFrame) mod 256
# (this fixture has no slime/darkEyes terms). Verifies key, valid and the 16
# VRAM colour bytes against the ROM colours table on EVERY done hit.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-enemy-cache/probe_${runName}.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
set throttle off
proc mem8 {addr} { return [debug read memory $addr] }
proc vram8 {addr} { return [debug read VRAM $addr] }

set COLROM 0x${colorsRom.toString(16).toUpperCase()}
set COLTABLE {${colTable.join(' ')}}
set COLBASE 0x${colorBase}
array set up {${slots.map(s => `${s} 0`).join(' ')}}
set evals 0
set doneHits 0
set boot_hits 0
debug set_bp 0x${init.toString(16).toUpperCase()} {} { incr ::boot_hits ; debug cont }
${uploadBps}
${evalBp}
${doneBps}

set IDX 0x${idxAddr.toString(16).toUpperCase()}
set COUNT 0x${countAddr.toString(16).toUpperCase()}
set POOL 0x${poolAddr.toString(16).toUpperCase()}
set STRIDE ${poolStride}
set NSLOTS ${Math.max(...slots) + 1}
set DURATION 5400
set n 0
set stale 0
set verified 0
set keyErrors 0
set vramFails 0
set anomalies {}
set lastIdx -1
set idxChanges 0
set done 0
set seenValid 0
set tickerr 0
set injected 0

proc done_slot {s} {
    global f n verified stale keyErrors vramFails COLTABLE COLBASE POOL STRIDE COUNT injected NSLOTS
    set cnt [mem8 $COUNT]
    if {$s >= $cnt} { return }
    if {[catch {
        if {$cnt > $NSLOTS} { error "invalid active count $cnt" }
        set base [expr {$POOL + $s * $STRIDE}]
        set a [expr {([mem8 [expr {$base + 12}]] + [mem8 [expr {$base + 9}]]) % 256}]
        ${negative ? `if {!$injected} { debug write memory [expr {${validAddr} + $s}] 0 ; set injected 1 ; logline "INJECT valid=0 slot=$s" }` : ''}
        ${hasCache ? `set key [mem8 [expr {${keysAddr} + $s}]]
        set valid [mem8 [expr {${validAddr} + $s}]]
        if {$valid != 1} { incr vramFails ; logline "ORACLE-FAIL slot=$s valid=$valid" }
        if {$key != $a} { incr keyErrors ; logline "KEY-FAIL slot=$s key=$key expectedA=$a" }` : ''}
        set ok 1
        for {set k 0} {$k < 16} {incr k} {
            set want [lindex $COLTABLE [expr {$a * 16 + $k}]]
            set got [vram8 [expr {$COLBASE + $s * 16 + $k}]]
            if {$want != $got} { set ok 0 ; break }
        }
        incr verified
        if {!$ok} {
            incr stale
            if {$stale <= 3} {
                set vh {}
                set wh {}
                for {set k 0} {$k < 16} {incr k} {
                    lappend vh [format %02X [vram8 [expr {$COLBASE + $s * 16 + $k}]]]
                    lappend wh [format %02X [mem8 [expr {$COLROM + $a * 16 + $k}]]]
                }
                logline "STALE frame=$n slot=$s expectedA=$a vram=[join $vh] romWanted=[join $wh]"
            }
        }
    } e]} { incr keyErrors ; logline "DONE-ERROR slot=$s: $e" }
}

proc tick {} {
    global f tickerr injected n verified stale keyErrors vramFails anomalies IDX COUNT NSLOTS DURATION done boot_hits up evals lastIdx idxChanges seenValid COLBASE COLTABLE POOL STRIDE
    after frame tick
    incr n
    if {[catch {
        if {$n >= $DURATION && !$done} {
            set done 1
            set upTotal 0
            foreach s {${slots.join(' ')}} { incr upTotal $up($s) }
            logline "frames=$n boot=$boot_hits stale=$stale verified=$verified keyErrors=$keyErrors vramFails=$vramFails tickerr=$tickerr evals=$evals uploads=$upTotal idxChanges=$idxChanges anomalies=[llength $anomalies] injected=$injected"
            logline [expr {($boot_hits == 1 && $stale == 0 && $verified > 0 && $keyErrors == 0 && $vramFails == 0 && $tickerr == 0${hasCache ? " && $upTotal > 0" : ""} && [llength $anomalies] == 0) ? "VERDICT: PASS" : "VERDICT: FAIL"}]
            logline "RUN-COMPLETE"
            close $f
            exit
        }
        set cnt [mem8 $COUNT]
        set idx [mem8 $IDX]
        if {$idx != $lastIdx} {
            if {$lastIdx != -1} { incr idxChanges ; logline "room change: $lastIdx -> $idx at frame $n" }
            set lastIdx $idx
        }
        if {$cnt <= $NSLOTS} {
            if {!$seenValid} { set seenValid 1 ; logline "game initialised at frame $n (count=$cnt)" }
        } elseif {$seenValid} {
            lappend anomalies "frame=$n cnt=$cnt (post-init out-of-range)"
        }
    } e]} { incr tickerr ; logline "TICK-ERROR($n): $e" ; if {$done} { catch {close $f} ; exit } }
}
logline "probe v6 start (build=${target}, INIT bp=0x${init.toString(16).toUpperCase()}, slots=${Math.max(...slots) + 1}, colorBase=#${colorBase}, oracle=pool-derived expected colour block)"
after frame tick
`;

const output = `test/msx2-screen5-enemy-cache/probe_${runName}`;
fs.writeFileSync(`${output}.tcl`, tcl);
fs.writeFileSync(`${output}.manifest.json`, JSON.stringify({ target, negative, files: [romPath, symPath, asmPath].map(path => ({ path, sha256: createHash('sha256').update(fs.readFileSync(path)).digest('hex') })) }, null, 2));
console.log(`probe v6 generated for target=${target}: slots=${Math.max(...slots) + 1}, colorBase=#${colorBase}, INIT=0x${init.toString(16).toUpperCase()}, colorsRom=0x${colorsRom.toString(16).toUpperCase()}, blocks=${colTable.length / 16}`);
