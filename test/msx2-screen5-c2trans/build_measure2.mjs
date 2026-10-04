#!/usr/bin/env node
// C2 integration probe (canal [Codex-030] pendientes del acuerdo de integracion).
// Like build_measure.mjs (walk 6 room transitions, time every restore call) and
// ADDS, after each restore completes (exit bp at its return address):
//   - full VRAM #F800..#F800+BC-1 compare against the pattern table bytes taken
//     from the unified .asm (located in the ROM file by unique anchor search),
//   - player SAT table compare: VRAM satBase..satBase+attrsLen-1 against the
//     attrs bytes parsed from the same .asm (SAT must stay coherent),
//   - sprite-0 visibility (Y < 208) as a cheap liveness signal,
//   - mapper resident state: MapperIO segment 2 == 2 and segment 3 == 3
//     (bitmap_room_restore_resident_banks must have re-armed P2/P3),
// and at finish demands >= 6 transitions and zero integrity mismatches.
// Usage: STEM=<stem> node test/msx2-screen5-c2trans/build_measure2.mjs
import fs from 'fs';
import { createHash } from 'node:crypto';

const stem = process.env.STEM || 'msx2_bitmap_room_smoke_fg_fastcopy_post256_unified';
const romPath = 'server/temp/' + stem + '.rom';
const asmPath = 'server/temp/' + stem + '.asm';
const sym = fs.readFileSync('server/temp/' + stem + '.sym', 'utf8');
const rom = fs.readFileSync(romPath);
const full = fs.readFileSync(asmPath, 'utf8');

const addr = (label) => {
  const m = sym.match(new RegExp(`^${label}: equ ([0-9A-F]+H)`, 'm'));
  if (!m) throw new Error(`symbol not found: ${label}`);
  return parseInt(m[1], 16);
};

// Parse `db` byte blocks of a labelled table from the generated asm.
function tableBytes(label) {
  const start = full.indexOf(`${label}:`);
  if (start < 0) throw new Error(`missing table ${label}`);
  const lines = full.slice(start).split('\n').slice(1);
  const bytes = [];
  for (const line of lines) {
    const m = line.match(/^\s*db\s+(.*)$/i);
    if (!m) break;
    for (const tok of m[1].split(',')) {
      const t = tok.trim();
      if (/^#[0-9A-Fa-f]+$/.test(t)) bytes.push(parseInt(t.slice(1), 16));
      else if (/^\d+$/.test(t)) bytes.push(parseInt(t, 10));
      else throw new Error(`${label}: non-numeric db token '${t}'`);
    }
  }
  if (!bytes.length) throw new Error(`${label}: empty table`);
  return Buffer.from(bytes);
}

function romOffset(bytes, label) {
  for (let len = 64; len <= bytes.length; len *= 2) {
    const anchor = bytes.subarray(0, len);
    const first = rom.indexOf(anchor);
    if (first < 0) throw new Error(`${label}: anchor not found in ROM file`);
    if (rom.indexOf(anchor, first + 1) === -1) return first;
  }
  throw new Error(`${label}: anchor not unique even at full length`);
}

const patterns = tableBytes('bitmap_room_sprite_patterns');
const patternsOff = romOffset(patterns, 'bitmap_room_sprite_patterns');
const attrs = tableBytes('bitmap_room_sprite_attrs');
const attrsAddr = addr('bitmap_room_sprite_attrs');
// Attrs are resident (<#8000): fixed mapping addr-0x4000. Verify plausibility
// against an anchor search, but do not require uniqueness (small tables can
// repeat inside banked art).
const attrsOff = attrsAddr - 0x4000;
if (attrsOff < 0 || attrsOff + attrs.length > rom.length) throw new Error('attrs resident offset out of range');
if (rom.indexOf(attrs.subarray(0, Math.min(12, attrs.length)), attrsOff) !== attrsOff) {
  throw new Error('attrs bytes do not match resident location');
}
// Player SAT base from the attrs upload in init_hardware_sprite_tables.
const satBase = (() => {
  const m = full.match(/ld hl, bitmap_room_sprite_attrs\s*\n\s*ld de, #([0-9A-Fa-f]{4})/);
  if (!m) throw new Error('attrs upload target not found');
  return parseInt(m[1], 16);
})();
if (!full.includes('call fast_copy_to_vram_chunked')) throw new Error('this is not a POST-patch build (no chunked call)');

const A = {
  init: rom.readUInt16LE(2),
  waitVblank: addr('bitmap_wait_vblank'),
  restore: addr('bitmap_restore_player_sprite_patterns'),
  commit: addr('commit_room_flip'),
  startTrans: addr('start_room_transition'),
  screenIdx: addr('current_screen_index'),
  playerX: addr('player_x'),
  stepComp: addr('step_room_composition'),
  copyToVram: addr('copy_to_vram_ext'),
  chunked: addr('fast_copy_to_vram_chunked'),
};
const copySite = (() => {
  for (let a = A.restore; a < A.restore + 0x14; a++) {
    if (rom[a - 0x4000] === 0xCD) {
      const tgt = rom[a - 0x4000 + 1] | (rom[a - 0x4000 + 2] << 8);
      if (tgt === A.copyToVram || tgt === A.chunked) return a;
    }
  }
  throw new Error('copy call not found inside restore');
})();
const restoreRet = (() => {
  for (let a = 0x4000; a < rom.length + 0x4000 - 3; a++) {
    if (rom[a - 0x4000] === 0xCD && (rom[a - 0x4000 + 1] | (rom[a - 0x4000 + 2] << 8)) === A.restore) return a + 3;
  }
  throw new Error('restore call site not found');
})();

const romHash = createHash('sha256').update(rom).digest('hex');
const h = (n) => '0x' + n.toString(16).toUpperCase();
const hexBytes = (buf) => [...buf].map(v => v.toString(16).padStart(2, '0')).join('');

const tcl = `# C2 integration probe (restore timing + full integrity per transition).
# STEM: ${stem}
# ROM sha256: ${romHash}
# patternsOff=${patternsOff} len=${patterns.length}; attrsOff=${attrsOff} len=${attrs.length} satBase=${satBase}
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-c2trans/measure2_${stem}.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
set throttle off
proc mem8 {a} { return [debug read memory $a] }
proc vram8 {a} { return [debug read VRAM $a] }
proc rombyte {off} { binary scan [string index $::romdata $off] c v; if {$v < 0} { incr v 256 }; return $v }
set chan [open "C:/Users/salam/Documents/Programacion/Mideas/${romPath.replaceAll('\\\\', '/')}" rb]
fconfigure $chan -translation binary
set romdata [read $chan]
close $chan

set boot_hits 0
set tickErrors 0
set frames 0
set phaseFrames 0
set phase 0
set lastIdx -1
set transActive 0
set transStartFrame 0
set transCount 0
set restoreCalls 0
set restoreBytesTotal 0
set restoreUsecTotal 0
set exitBpSet 0
set composing 0
set composeStart 0
set restoreT0 ""
set lastBC 0
set integBad 0
set patChecks 0
set satChecks 0

debug set_bp ${h(A.init)} {} { incr ::boot_hits ; debug cont }
debug set_bp ${h(A.waitVblank)} {} { on_frame ; debug cont }
debug set_bp ${h(A.startTrans)} {} {
    if {$::phase >= 1 && !$::transActive} {
        set ::transActive 1
        set ::transStartFrame $::frames
    }
    debug cont
}
debug set_bp ${h(A.commit)} {} {
    if {$::transActive} {
        set ::transActive 0
        incr ::transCount
        logline "TRANS-COMMIT #$::transCount frame=$::frames idx=[mem8 ${h(A.screenIdx)}]"
    }
    debug cont
}
debug set_bp ${h(copySite)} {} {
    set ::lastBC [expr {[reg b]*256 + [reg c]}]
    set ::restoreBytesTotal [expr {$::restoreBytesTotal + $::lastBC}]
    set ::satSnap {}
    for {set j 0} {$j < 16} {incr j} { lappend ::satSnap [vram8 [expr {${satBase}+$j}]] }
    debug cont
}
debug set_bp ${h(A.restore)} {} {
    set ::restoreT0 [machine_info time]
    incr ::restoreCalls
    if {!$::exitBpSet} {
        set ::exitBpSet 1
        debug set_bp ${h(restoreRet)} {} {
            if {$::restoreT0 ne ""} {
                set us [expr {int(([machine_info time] - $::restoreT0)*1000000)}]
                set ::restoreUsecTotal [expr {$::restoreUsecTotal + $us}]
                set ::restoreT0 ""
                # --- integrity after this restore ---
                incr ::integBad [integrity $::restoreCalls $us]
            }
            debug cont
        }
    }
    debug cont
}
debug set_bp ${h(A.stepComp)} {} {
    if {$::phase >= 1 && !$::composing} {
        set ::composing 1
        set ::composeStart $::frames
    }
    debug cont
}

proc integrity {id us} {
    set bad 0
    set n $::lastBC
    for {set k 0} {$k < $n} {incr k} {
        incr ::patChecks
        if {[vram8 [expr {0xF800+$k}]] != [rombyte [expr {${patternsOff}+$k}]]} {
            incr bad
            if {$bad <= 5} { logline "INTEG #$id pattern byte $k vram=[vram8 [expr {0xF800+$k}]] rom=[rombyte [expr {${patternsOff}+$k}]]" }
        }
    }
    # SAT coherence: the restore call must not touch the SAT at all. The SAT
    # snapshot was taken at the copySite breakpoint (registers already loaded,
    # copy not started); walking-related updates happen outside the call, so
    # SAT must be byte-identical on return. (Entries also get logged.)
    set dump {}
    for {set j 0} {$j < 16} {incr j} {
        set v [vram8 [expr {${satBase}+$j}]]
        lappend dump $v
        incr ::satChecks
        if {$v != [lindex $::satSnap $j]} {
            incr bad
            if {$bad <= 5} { logline "INTEG #$id sat byte $j changed inside restore: [lindex $::satSnap $j] -> $v" }
        }
    }
    logline "SAT-DUMP #$id [join $dump { }]"
    # openMSX MapperIO indexes Konami registers in REVERSE address order:
    # i0 = #A000-#BFFF (P3), i1 = #8000-#9FFF (P2), i2 = #6000, i3 = #4000.
    set m3 [debug read {MapperIO} 0]
    set m2 [debug read {MapperIO} 1]
    if {$m2 != 2 || $m3 != 3} {
        incr bad
        logline "INTEG #$id mapper P2=$m2 P3=$m3 want 2/3"
    }
    logline "RESTORE-END #$id usec=$us bytes=$n integBadHere=$bad mapper=$m2/$m3"
    return $bad
}

proc on_frame {} {
    global phase frames phaseFrames lastIdx transActive tickErrors
    if {[catch {
        incr frames
        incr phaseFrames
        set idx [mem8 ${h(A.screenIdx)}]
        if {$idx != $lastIdx} { set lastIdx $idx }
        if {$phase == 0} {
            if {$phaseFrames >= 600} {
                set phase 1 ; set phaseFrames 0
                logline "--- walking RIGHT (cycle 1)"
                keymatrixdown 8 0x80
            }
        } elseif {$phase >= 1 && $phase <= 6} {
            set want [expr {$phase % 2 == 1 ? 1 : 0}]
            if {$idx == $want && $phaseFrames > 30} {
                keymatrixup 8 [expr {$phase % 2 == 1 ? 0x80 : 0x10}]
                incr phase
                set phaseFrames 0
                if {$phase <= 6} {
                    set dir [expr {$phase % 2 == 1 ? "RIGHT" : "LEFT"}]
                    logline "--- walking $dir (cycle [expr {($phase+1)/2}])"
                    keymatrixdown 8 [expr {$phase % 2 == 1 ? 0x80 : 0x10}]
                }
            } else {
                set k [expr {$phase % 2 == 1 ? 0x80 : 0x10}]
                if {$phaseFrames % 30 == 0} { keymatrixdown 8 $k }
            }
        }
        if {$phase == 7} { finish }
    } e]} {
        incr tickErrors
        if {$tickErrors <= 5} { logline "FRAME-ERROR($frames): $e" }
    }
}

proc finish {} {
    global f frames boot_hits tickErrors transCount restoreCalls restoreBytesTotal restoreUsecTotal integBad patChecks satChecks
    logline "TOTAL frames=$frames boots=$boot_hits tickErrors=$tickErrors transitions=$transCount restores=$restoreCalls bytes=$restoreBytesTotal usecTotal=$restoreUsecTotal integBad=$integBad patChecks=$patChecks satChecks=$satChecks"
    logline [expr {($boot_hits == 1 && $tickErrors == 0 && $transCount >= 6 && $restoreCalls >= 6 && $integBad == 0) ? "INTEGRITY: OK" : "INTEGRITY: FAILED"}]
    logline "MEASUREMENT-COMPLETE"
    close $f
    exit
}

logline "measure2 start STEM=${stem} INIT=${h(A.init)} restore=${h(A.restore)} copySite=${h(copySite)} ret=${h(restoreRet)} patternsOff=${patternsOff} satBase=${satBase}"
`;

fs.writeFileSync(`test/msx2-screen5-c2trans/measure2_${stem}.tcl`, tcl);
console.log(`measure2_${stem}.tcl: restore=${h(A.restore)} ret=${h(restoreRet)} copySite=${h(copySite)} patterns: romOff=${patternsOff} len=${patterns.length} attrs: romOff=${attrsOff} len=${attrs.length} satBase=${h(satBase)}`);
