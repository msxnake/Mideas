# Hardware probe: does the attack phase actually escalate as the boss loses HP?
#
# The generator can emit a perfect table and the runtime still read it at the
# wrong stride, so this pokes boss_hp across each threshold and reads back the
# bytes bitmap_boss_phase_apply parked in RAM.
#
# Build the ROM first:
#   node scripts/build_msx2_boss_phase_escalation_smoke.mjs
#   python scripts/build_mideas_unified_rom.py --json test/msx2-boss/fixture_phase_escalation.json --rom-mode megarom
#   openmsx -cart server/temp/msx2_boss_phase_escalation_smoke_unified.rom -romtype KonamiSCC -script test/boss_phase_escalation_probe.tcl
#
# Verified on 2026-08-22 (boss HP 5; thresholds 5 / 3 / 2):
#
#   hp 5 -> int 40 spd 3 shoot 0 laser 0  body 0 move 1    38 px/s   phase_1
#   hp 3 -> int 30 spd 3 shoot 1 laser 0  body 0 move 2    76 px/s   phase_2
#   hp 2 -> int 18 spd 4 shoot 1 laser 40 body 2 move 3   162 px/s   phase_3
#
# The px/s column is the point of the movement multiplier: it is measured, not
# trusted. Two steps per update really is twice the ground, and phase_3 adds the
# halved body cadence on top.

set root "C:/Users/salam/Documents/Programacion/Mideas"
set log [open "$root/server/temp/boss_phase_escalation_probe.txt" w]

proc rb {a} { return [debug read memory $a] }
proc wb {a v} { debug write memory $a $v }

set BOSS_ACTIVE  0xD16F
set BOSS_X       0xD170
set BOSS_HP      0xD176
set PH_INT       0xD1D2
set PH_SPD       0xD1D3
set PH_SHOOT     0xD1D4
set PH_LASER     0xD1D5
set PH_BODY      0xD1D6
set PH_MOVE      0xD1D7
set SCREEN_IDX   0xC00B
set INTRO_STATE  0xD1D8
# boss_hp is per-instance saved state: poking the named field is overwritten by
# bitmap_boss_state_load on the next frame, so the poke goes into slot 0's block
# (boss_instance_state + 7, the offset of boss_hp in stateByteFields).
set SLOT0_HP     [expr {0xD1E8 + 7}]

proc dump {tag} {
    global log BOSS_HP PH_INT PH_SPD PH_SHOOT PH_LASER PH_BODY PH_MOVE BOSS_X INTRO_STATE
    puts $log [format "%-10s hp=%-3d int=%-3d spd=%-2d shoot=%-2d laser=%-3d body=%-2d move=%-2d x=%-3d intro=%d" \
        $tag [rb $BOSS_HP] [rb $PH_INT] [rb $PH_SPD] [rb $PH_SHOOT] \
        [rb $PH_LASER] [rb $PH_BODY] [rb $PH_MOVE] [rb $BOSS_X] [rb $INTRO_STATE]]
    flush $log
}

# Ground covered over a fixed wall-clock window, which is what "moves faster"
# means to a player. ACCUMULATED between close samples on purpose: the patrol
# bounces off its bounds, so a fast boss can end the window near where it
# started and a start-to-end measurement would report it as the slowest one.
proc travel {tag hp} {
    global log BOSS_HP BOSS_X SLOT0_HP
    wb $SLOT0_HP $hp
    wb $BOSS_HP $hp
    after time 0.6 [list travel_start $tag]
}
proc travel_start {tag} {
    global BOSS_X
    set ::travel_tag $tag
    set ::travel_prev [rb $BOSS_X]
    set ::travel_sum 0
    set ::travel_left 20
    after time 0.05 travel_tick
}
proc travel_tick {} {
    global log BOSS_X
    set now [rb $BOSS_X]
    set step [expr {abs($now - $::travel_prev)}]
    # A wrap past the 0/255 edge is not real movement.
    if {$step < 128} { set ::travel_sum [expr {$::travel_sum + $step}] }
    set ::travel_prev $now
    incr ::travel_left -1
    if {$::travel_left > 0} { after time 0.05 travel_tick; return }
    puts $log [format "%-10s ground covered in 1s: %d px" $::travel_tag $::travel_sum]
    flush $log
    dump $::travel_tag
    next_step
}

set steps {5 3 2}
set stepIndex 0
proc next_step {} {
    global steps stepIndex log
    if {$stepIndex >= [llength $steps]} {
        puts $log "done"
        close $log
        exit
    }
    set hp [lindex $steps $stepIndex]
    incr stepIndex
    travel "hp=$hp" $hp
}

proc after_intro {} {
    dump "start"
    next_step
}

set waited 0
proc wait_for_boss {} {
    global log BOSS_ACTIVE SCREEN_IDX waited
    incr waited
    if {[rb $BOSS_ACTIVE] != 1} {
        if {$waited > 60} {
            puts $log "boss never became active (screen index [rb $SCREEN_IDX]); the probe cannot reach the boss room unattended"
            close $log
            exit
        }
        after time 0.5 wait_for_boss
        return
    }
    puts $log "boss alive on screen index [rb $SCREEN_IDX] after [expr {$waited * 0.5}]s"
    # The Room Lock intro (auto-walk) freezes the fight, and this fixture never
    # leaves it unattended: the probe is about the phase resolver, so skip it.
    if {[rb $::INTRO_STATE] != 0} {
        wb $::INTRO_STATE 0
        puts $log "intro sequence skipped (was [rb $::INTRO_STATE])"
    }
    after time 0.5 [list after_intro]
}

# The flow opens on a Screen5Presentation with waitForKey, so nothing reaches
# the boss room until something presses a key.
set presses 0
proc press {} {
    global presses
    incr presses
    if {$presses > 24} { return }
    type " "
    after time 0.5 press
}

after time 3.0 press
after time 12.0 wait_for_boss
after time 120 { puts $log "timeout"; close $log; exit }
