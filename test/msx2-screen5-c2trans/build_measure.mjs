#!/usr/bin/env node
// C2-MEDICION probe (canal [Codex-022]/[ZCode-024]): baseline profile of the
// room-transition path on the FG fixture (two WALKABLE rooms — transitions
// proven in the A1 evidence). No generator changes; measures current HEAD.
//
// Measures, separating boot from room transitions (by return address):
//   - every bitmap_restore_player_sprite_patterns call: caller (boot vs
//     commit_room_flip), byte count BC, source HL, dest DE, and the emulated
//     time of the whole routine (entry bp + dynamic exit bp at its return
//     address, set once from the stack)
//   - per transition: frames from start_room_transition (edge queued) to
//     commit_room_flip (page published), and frames to a stable room index
//   - screen index trace, SAT dump at the two stable-A moments (logged for
//     the record, not asserted: the scripted walker moves legitimately)
//   - boot count, cumulative errors, ROM/SYM sha256 in the log header
// Usage: node test/msx2-screen5-c2trans/build_measure.mjs
import fs from 'fs';
import { createHash } from 'node:crypto';

const stem = process.env.STEM || 'msx2_bitmap_room_smoke_fg_fastcopy_unified';
const romPath = 'server/temp/' + stem + '.rom';
const symPath = 'server/temp/' + stem + '.sym';
const sym = fs.readFileSync(symPath, 'utf8');
const rom = fs.readFileSync(romPath);
const addr = (label) => {
  const m = sym.match(new RegExp(`^${label.replace(/\./g, '\\.')}: equ ([0-9A-F]+H)`, 'm'));
  if (!m) throw new Error(`symbol not found: ${label}`);
  return parseInt(m[1], 16);
};
const A = {
  init: rom.readUInt16LE(2),
  waitVblank: addr('bitmap_wait_vblank'),
  restore: addr('bitmap_restore_player_sprite_patterns'),
  commit: addr('commit_room_flip'),
  startTrans: addr('start_room_transition'),
  screenIdx: addr('current_screen_index'),
  playerX: addr('player_x'),
  pageVar: addr('bitmap_displayed_page'),
  patternsBank: addr('bitmap_room_sprite_patterns_DATA_BANK'),
  stepComp: addr('step_room_composition'),
  copyToVram: addr('copy_to_vram_ext'),
  chunked: (() => { const m = sym.match(/^fast_copy_to_vram_chunked: equ ([0-9A-F]+)H/m); return m ? parseInt(m[1],16) : null; })(),
};
// The real VRAM copy inside the 20-byte restore routine: scan its body for
// `call copy_to_vram_ext` (opcode CD + target). Registers BC/HL/DE are valid
// THERE (loaded just before), not at routine entry.
const copySite = (() => {
  for (let a = A.restore; a < A.restore + 0x14; a++) {
    if (rom[a - 0x4000] === 0xCD) {
      const tgt = rom[a - 0x4000 + 1] | (rom[a - 0x4000 + 2] << 8);
      // Accept either copier: the patched build calls fast_copy_to_vram_chunked.
      if (tgt === A.copyToVram || tgt === A.chunked) return a;
    }
  }
  throw new Error('copy call not found inside restore');
})();
// Sole call site of restore -> its return address classifies EVERY call as a
// room-transition commit (boot uses init_hardware_sprite_tables' own copies).
const restoreRet = (() => {
  for (let a = 0x4000; a < 0x8000 - 3; a++) {
    if (rom[a - 0x4000] === 0xCD && (rom[a - 0x4000 + 1] | (rom[a - 0x4000 + 2] << 8)) === A.restore) return a + 3;
  }
  throw new Error('restore call site not found');
})();
const romHash = createHash('sha256').update(rom).digest('hex');
const symHash = createHash('sha256').update(fs.readFileSync(symPath)).digest('hex');
const h = (n) => '0x' + n.toString(16).toUpperCase();

const tcl = `# C2 room-transition baseline measurement (ACUERDO C2-medicion).
# ROM sha256: ${romHash}
# SYM sha256: ${symHash}
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-c2trans/measure_${stem}.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
set throttle off
proc mem8 {a} { return [debug read memory $a] }
proc vram8 {a} { return [debug read VRAM $a] }
proc now {} { return [machine_info time] }

set boot_hits 0
set tickErrors 0
set phase 0
set frames 0
set phaseFrames 0
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
set restoreCaller ""
set snapA1 ""
set satA1 ""

debug set_bp ${h(A.init)} {} { incr ::boot_hits ; debug cont }
debug set_bp ${h(A.waitVblank)} {} { on_frame ; debug cont }

# Transition trigger: edge queued.
debug set_bp ${h(A.startTrans)} {} {
    if {$::phase >= 1 && !$::transActive} {
        set ::transActive 1
        set ::transStartFrame $::frames
        logline "TRANS-PROBE-FIRST frame=$::frames idx=[mem8 ${h(A.screenIdx)}] px=[mem8 ${h(A.playerX)}] (per-frame probe begins)"
    }
    debug cont
}

# Commit: hidden page published.
debug set_bp ${h(A.commit)} {} {
    if {$::transActive} {
        set ::transActive 0
        incr ::transCount
        set cwin [expr {$::composing ? ($::frames - $::composeStart) : -1}]
        logline "TRANS-COMMIT #$::transCount frame=$::frames idx=[mem8 ${h(A.screenIdx)}] composeFrames=$cwin"
        set ::composing 0
    }
    debug cont
}

# Restore patterns: classify by caller, capture BC/HL/DE, time via exit bp.
# Restore entry: time the whole routine via its single return address.
debug set_bp ${h(A.restore)} {} {
    set ::restoreT0 [now]
    incr ::restoreCalls
    if {!$::exitBpSet} {
        set ::exitBpSet 1
        debug set_bp ${h(restoreRet)} {} {
            if {$::restoreT0 ne ""} {
                set us [expr {int(([now] - $::restoreT0)*1000000)}]
                set ::restoreUsecTotal [expr {$::restoreUsecTotal + $us}]
                logline "RESTORE-END usec=$us"
                set ::restoreT0 ""
            }
            debug cont
        }
    }
    debug cont
}
# The real copy: BC/HL/DE valid here (loaded immediately before).
debug set_bp ${h(copySite)} {} {
    set bc [expr {[reg b]*256 + [reg c]}]
    set hl [expr {[reg h]*256 + [reg l]}]
    set de [expr {[reg d]*256 + [reg e]}]
    set ::restoreBytesTotal [expr {$::restoreBytesTotal + $bc}]
    logline "COPY bytes=$bc hl=[format %04X $hl] de=[format %04X $de]"
    debug cont
}
# Composition window: first step after idle = transition work begins.
debug set_bp ${h(A.stepComp)} {} {
    if {$::phase >= 1 && !$::composing} {
        set ::composing 1
        set ::composeStart $::frames
        logline "COMPOSE-START frame=$::frames"
    }
    debug cont
}

proc sat_dump {} {
    set out {}
    for {set i 0} {$i < 16} {incr i} { lappend out [format %02X [vram8 [expr {0xF600+$i}]]] }
    return [join $out]
}

proc on_frame {} {
    global phase frames phaseFrames lastIdx transActive tickErrors snapA1 satA1
    if {[catch {
        incr frames
        incr phaseFrames
        set idx [mem8 ${h(A.screenIdx)}]
        if {$idx != $lastIdx} { logline "IDX $lastIdx -> $idx at frame $frames" ; set lastIdx $idx }
        if {$phase == 0} {
            if {$phaseFrames == 400} {
                set snapA1 [sat_dump]
                logline "SAT stableA-start $snapA1"
            }
            if {$phaseFrames >= 600} {
                set phase 1 ; set phaseFrames 0
                logline "--- walking RIGHT (cycle 1)"
                keymatrixdown 8 0x80
            }
        } elseif {$phase >= 1 && $phase <= 6} {
            # cycles: odd phases walk RIGHT to room B, even walk LEFT to room A
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
    global f frames boot_hits tickErrors restoreCalls restoreBytesTotal restoreUsecTotal transCount satA1
    set satA2 [sat_dump]
    logline "SAT stableA-end   $satA2"
    logline "TOTAL frames=$frames boot_hits=$boot_hits tickErrors=$tickErrors transitions=$transCount restoreCalls=$restoreCalls restoreBytes=$restoreBytesTotal restoreUsecTotal=$restoreUsecTotal"
    logline [expr {($boot_hits == 1 && $tickErrors == 0 && $transCount >= 6 && $restoreCalls > 0) ? "INSTRUMENT: CLEAN" : "INSTRUMENT: DIRTY"}]
    logline "MEASUREMENT-COMPLETE baseline (no patch applied)"
    close $f
    exit
}

logline "measure start ROM=${romHash.slice(0, 16)}... INIT=${h(A.init)} restore=${h(A.restore)} commit=${h(A.commit)} startTrans=${h(A.startTrans)}"
`;

fs.writeFileSync(`test/msx2-screen5-c2trans/measure_${stem}.tcl`, tcl);
console.log(`measure_baseline.tcl generated: restore=${h(A.restore)} commit=${h(A.commit)} startTrans=${h(A.startTrans)} patternsBank=bank${A.patternsBank}`);
