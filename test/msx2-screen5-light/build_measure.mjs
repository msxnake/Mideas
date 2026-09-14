#!/usr/bin/env node
// Generate the dark-room lighting BASELINE measurement probe (ACUERDO C1-medicion,
// canal exchange.txt [Codex-020]/[ZCode-020]). No generator changes: measures
// the current build only.
//
// Per-phase metrics (settle / idle / moveX / moveY / diagonal / stage cycle):
//   - game ticks per emulated second (bitmap_wait_vblank crossings; NOT the
//     emulator's render FPS)
//   - light rects launched (bp at lightRect+3, i.e. after its CE wait) and
//     their pixel area (VDP regs R#40-43 hold the PREVIOUS rect's NX/NY)
//   - emulated seconds inside the light-rect CE waits (bp pair: waitCmd entry
//     filtered by return address == lightRect+3, closed at lightRect+3)
//   - span from first light_update entry to last rect-done of the frame
//   - boot count, cumulative errors, idle-phase VRAM stability snapshots,
//     and an instrument self-test of the VRAM differ (poke/detect/restore)
//
// Directed inputs (documented per the agreement): the torch does not start lit
// and burns down, so active/on/stage are re-poked every 60 frames; phase 6
// cycles the stage to force halo resizes. If the boot room is not dark, ONE
// directed load_room(A=0) is injected at the wait_vblank safe point.
//
// Declared limitations: bitmap_light_drain_cmd polls CE inline (with music
// keep-alive) and is NOT part of the rect-wait time; the span over-covers the
// tail after the last rect (status restore etc.).
// Usage: node test/msx2-screen5-light/build_measure.mjs
import fs from 'fs';
import { createHash } from 'node:crypto';

const romPath = 'server/temp/test501_bats_unified.rom';
const symPath = 'server/temp/test501_bats_unified.sym';
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
  lightUpdate: addr('bitmap_light_update'),
  lightRect: addr('bitmap_light_rect'),
  waitCmd: addr('vdp_wait_cmd_ready'),
  loadRoom: addr('load_room'),
  screenIdx: addr('current_screen_index'),
  playerX: addr('player_x'),
  lightActive: addr('bitmap_light_active'),
  lightOn: addr('bitmap_light_on'),
  lightStage: addr('bitmap_light_stage'),
  lightTimer: addr('bitmap_light_timer'),
  lightX: addr('bitmap_light_x'),
  lightY: addr('bitmap_light_y'),
  pageVar: addr('bitmap_displayed_page'),
};
const romHash = createHash('sha256').update(rom).digest('hex');
const symHash = createHash('sha256').update(fs.readFileSync(symPath)).digest('hex');
const h = (n) => '0x' + n.toString(16).toUpperCase();
// Per-room darkness as emitted in the ASM (active world, 7 rooms).
const ROOM_FLAGS = '1 1 1 1 1 0 0';
const PHASES = ['settle', 'idle', 'moveX', 'moveY', 'diagonal', 'stageCycle'];
const PHASE_LEN = [900, 1200, 1200, 1200, 1200, 1200];

const tcl = `# Dark-room lighting baseline measurement (ACUERDO C1-medicion).
# ROM sha256: ${romHash}
# SYM sha256: ${symHash}
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-light/measure_baseline.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
set throttle off
proc mem8 {a} { return [debug read memory $a] }
proc vram8 {a} { return [debug read VRAM $a] }
proc vdpreg {r} { return [debug read "VDP regs" $r] }
proc now {} { return [machine_info time] }

# ---- state ----
set ROOMFLAGS {${ROOM_FLAGS}}
set PHASENAMES {${PHASES.map(p => `'${p}'`).join(' ')}}
set PHASELEN {${PHASE_LEN.join(' ')}}
set boot_hits 0
set tickErrors 0
set anomalies {}
set phase 0
set phaseFrames 0
set totalFrames 0
set tPhase0 [now]
set injectedLoad 0
set snapP0 ""
set snapP1 ""
# per-phase accumulators (microseconds as integers for wait/span)
foreach p {0 1 2 3 4 5} { set rects($p) 0 ; set pix($p) 0 ; set waits($p) 0 ; set usecWait($p) 0 ; set usecSpan($p) 0 ; set framesP($p) 0 }
# per-frame scratch
set pendingRects 0
set rectT0 ""
set lightUpdateAt 0
set lastRectAt 0
set frameRects 0

proc phase_name {} { global phase ; return [lindex $::PHASENAMES $phase] }

# ---- breakpoints ----
debug set_bp ${h(A.init)} {} { incr ::boot_hits ; debug cont }

debug set_bp ${h(A.waitVblank)} {} { on_frame ; debug cont }

debug set_bp ${h(A.lightUpdate)} {} { set ::lightUpdateAt [now] ; debug cont }

# CE wait of a light rect = entry -> entry+3 (the wait is its first call).
# No bp on vdp_wait_cmd_ready: it fires for every subsystem and would drown
# the emulator in Tcl overhead (lesson from the first run).
debug set_bp ${h(A.lightRect)} {} {
    set ::rectT0 [now]
    harvest_prev
    incr ::rects($::phase)
    incr ::pendingRects
    incr ::waits($::phase)
    debug cont
}
debug set_bp ${h(A.lightRect + 3)} {} {
    set t [now]
    if {[info exists ::rectT0]} {
        set ::usecWait($::phase) [expr {$::usecWait($::phase) + int(($t - $::rectT0)*1000000)}]
        unset ::rectT0
    }
    set ::lastRectAt $t
    debug cont
}
# [Codex-021] precision: sample CE before the FIRST parameter write (R#36,
# rect+13) AND before the launch (R#46, rect+57) — checking only R46 could
# miss an earlier corruption if CE drops between both. Non-intrusive read of
# the status debuggable (no S#0 consumption, no R#15 change). Applies to the
# LMMV path this probe measures.
set ceViolR36 0
set ceViolR46 0
proc sample_ce {which} {
    set ce [debug read "VDP status regs" 2]
    if {$ce & 1} {
        incr ::ceViol$which
        if {[set ::ceViol$which] <= 3} { logline "CE-VIOLATION at $which (S#2=\[format %02X \$ce\])" }
    }
}
debug set_bp ${h(A.lightRect + 13)} {} { sample_ce R36 ; debug cont }
debug set_bp ${h(A.lightRect + 57)} {} { sample_ce R46 ; debug cont }

proc harvest_prev {} {
    global pendingRects pix phase
    if {$pendingRects <= 0} { return }
    set nx [expr {[vdpreg 40] + 256*[vdpreg 41]}]
    set ny [expr {[vdpreg 42] + 256*[vdpreg 43]}]
    set pix($phase) [expr {$pix($phase) + $nx*$ny}]
    incr pendingRects -1
}

proc poke_light {st} {
    debug write memory ${h(A.lightActive)} 1
    debug write memory ${h(A.lightOn)} 1
    debug write memory ${h(A.lightStage)} $st
    # Keep the fuel topped: the game burns light_timer each tick and forces
    # light_on=0 at zero (directed input, documented).
    debug write memory ${h(A.lightTimer)} 0xFF
    debug write memory [expr {${h(A.lightTimer)}+1}] 0xFF
}

proc halo_addr {} {
    set pg [mem8 ${h(A.pageVar)}]
    set lx [mem8 ${h(A.lightX)}]
    set ly [mem8 ${h(A.lightY)}]
    set byte [expr {$lx >> 1}]
    set a [expr {$pg*0x8000 + ($ly - 8)*128 + $byte - 8}]
    if {$a < 0} { set a 0 }
    return $a
}

proc snap {base} {
    set out {}
    for {set i 0} {$i < 32} {incr i} { lappend out [format %02X [vram8 [expr {$base+$i}]]] }
    return [join $out]
}

proc on_frame {} {
    global phase phaseFrames totalFrames tPhase0 tickErrors anomalies injectedLoad
    global snapP0 snapP1 ROOMFLAGS PHASELEN pendingRects lightUpdateAt lastRectAt
    if {[catch {
        incr totalFrames
        incr phaseFrames
        incr ::frameFlag
        # Directed load_room(A=0) once, if the boot room is not dark.
        if {$phase == 0 && !$injectedLoad && $totalFrames > 500} {
            set injectedLoad 1
            set idx [mem8 ${h(A.screenIdx)}]
            if {$idx < [llength $ROOMFLAGS] && [lindex $ROOMFLAGS $idx] != 1} {
                set here ${h(A.waitVblank)}
                set sp [reg sp]
                debug write memory [expr {$sp-1}] [expr {($here>>8)&0xFF}]
                debug write memory [expr {$sp-2}] [expr {$here&0xFF}]
                reg sp [expr {$sp-2}]
                reg a 0
                reg pc ${h(A.loadRoom)}
                logline "DIRECTED load_room(A=0) injected at frame $totalFrames (boot room idx=$idx not dark)"
                return
            }
            logline "boot room idx=$idx is dark: no directed load needed"
        }
        # Torch keep-alive + stage cycling.
        if {$phase >= 1} {
            if {$phaseFrames % 60 == 1} {
                set st 1
                if {$phase == 5} { set st [expr {1 + (($phaseFrames/60) % 3)}] }
                poke_light $st
            }
        }
        # Phase inputs.
        if {$phase == 2 && $phaseFrames == 1} { keymatrixdown 8 0x80 }
        if {$phase == 3 && $phaseFrames == 1} { keymatrixup 8 0x80 ; keymatrixdown 8 0x01 }
        if {$phase == 4 && $phaseFrames == 1} { keymatrixdown 8 0x80 }
        if {$phase == 5 && $phaseFrames == 1} { keymatrixup 8 0x80 ; keymatrixup 8 0x01 }
        # Idle-phase snapshot once the first paint settled.
        if {$phase == 1 && $phaseFrames == 90} {
            set ::snapAddr [halo_addr]
            set snapP0 [snap $::snapAddr]
            logline "SNAPSHOT idle@90 halo p0=$snapP0"
        }
        # End-of-frame: harvest the last rect and close the span.
        harvest_prev
        if {$lastRectAt >= $lightUpdateAt && $lightUpdateAt > 0} {
            set ::usecSpan($phase) [expr {$::usecSpan($phase) + int(($lastRectAt - $lightUpdateAt)*1000000)}]
        }
        set lightUpdateAt 0
        set lastRectAt 0
        # Phase end.
        if {$phaseFrames >= [lindex $PHASELEN $phase]} { next_phase }
    } e]} {
        incr tickErrors
        if {$tickErrors <= 5} { logline "FRAME-ERROR($totalFrames): $e" }
    }
}

proc next_phase {} {
    global phase phaseFrames tPhase0 rects pix waits usecWait usecSpan framesP totalFrames
    global snapP0 snapP1 tickErrors anomalies
    set dt [expr {[now] - $tPhase0}]
    set tps [expr {$dt > 0 ? $phaseFrames/$dt : 0}]
    set avgR [expr {$phaseFrames > 0 ? double($rects($phase))/$phaseFrames : 0}]
    logline [format "PHASE %s: frames=%d secs=%.3f ticks/s=%.3f rects=%d avgRects/frame=%.2f Mpix=%.3f lightCEwaits=%d waitCE=%.1fms span=%.1fms" [lindex $::PHASENAMES $phase] $phaseFrames $dt $tps $rects($phase) $avgR [expr {$pix($phase)/1000000.0}] $waits($phase) [expr {$usecWait($phase)/1000.0}] [expr {$usecSpan($phase)/1000.0}]]
    if {$phase == 0 && $rects(0) != 0} { logline "NOTE: rects during settle = room-entry light paint (expected, one-shot)" }
    if {$phase == 1} {
        set p0 [snap $::snapAddr]
        if {$p0 eq $snapP0} { logline "IDLE-VRAM-STABLE halo OK" } else { logline "IDLE-VRAM halo CHANGED (unexpected: static halo)" ; lappend anomalies idle-vram }
    }
    incr phase
    set phaseFrames 0
    set tPhase0 [now]
    if {$phase == 1} {
        # Instrument self-test: poke one VRAM byte, the differ must see it, restore.
        set orig [vram8 0x0020]
        debug write VRAM 0x0020 [expr {$orig ^ 0xFF}]
        if {[vram8 0x0020] != $orig} {
            logline "SELFTEST differ DETECTED poked byte; restoring"
            debug write VRAM 0x0020 $orig
            if {[vram8 0x0020] == $orig} { logline "SELFTEST restored OK" } else { logline "SELFTEST-FAIL restore" ; lappend anomalies selftest-restore }
        } else {
            logline "SELFTEST-FAIL: poked byte not visible"
            lappend anomalies selftest-detect
        }
    }
    if {$phase >= 6} { finish }
}

proc finish {} {
    global f totalFrames boot_hits tickErrors anomalies ceViolR36 ceViolR46
    logline "TOTAL frames=$totalFrames boot_hits=$boot_hits tickErrors=$tickErrors ceViolR36=$ceViolR36 ceViolR46=$ceViolR46 anomalies=[llength $anomalies] $anomalies"
    logline [expr {($boot_hits == 1 && $tickErrors == 0 && $ceViolR36 == 0 && $ceViolR46 == 0 && [llength $anomalies] == 0) ? "INSTRUMENT: CLEAN" : "INSTRUMENT: DIRTY"}]
    logline "MEASUREMENT-COMPLETE baseline (profile above; no patch applied)"
    close $f
    exit
}

logline "measure start ROM=${romHash.slice(0, 16)}... INIT=${h(A.init)} lightRect=${h(A.lightRect)} waitCmd=${h(A.waitCmd)} loadRoom=${h(A.loadRoom)}"

# Autonomous intro skipper: the intro's wait loops never call wait_vblank, so
# on_frame cannot drive this. Pulse SPACE on a wall-independent emulated timer
# until the main loop is observed running (frameFlag set by the vblank bp).
set introAlive 1
proc intro_poker {} {
    global introAlive frameFlag f
    if {!$introAlive} { return }
    if {[info exists frameFlag] && $frameFlag > 3} { set introAlive 0 ; keymatrixup 8 0x01 ; logline "intro passed (main loop running)" ; return }
    keymatrixdown 8 0x01
    after time 0.25 { keymatrixup 8 0x01 }
    after time 0.75 intro_poker
}
after time 0.5 intro_poker
`;

fs.writeFileSync('test/msx2-screen5-light/measure_baseline.tcl', tcl);
console.log(`measure_baseline.tcl generated: INIT=${h(A.init)} lightRect=${h(A.lightRect)}(+3=${h(A.lightRect + 3)}) waitCmd=${h(A.waitCmd)} loadRoom=${h(A.loadRoom)}`);
