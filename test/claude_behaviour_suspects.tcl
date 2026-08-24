# Claude probe: the three suspects of the scripted-enemy interpreter, on hardware.
#
# Symbols re-resolved from server/temp/behaviour_probe/behaviour2.sym — THIS
# build, after the bounds fix. They happen to match the previous build because
# the fix changed data and not code layout, but they were looked up again
# rather than inherited: a probe that measures the wrong instruction is worse
# than no probe.
#
#   bitmap_enemy_count           0xD000
#   bitmap_enemy_pool            0xD001, stride 28
#   bitmap_enemy_script_step     0x611F
#   bitmap_enemy_script_act_jump 0x63ED
#   bitmap_enemy_script_act_fall 0x63F6
#
# THE SCRIPTED ENEMY IS SLOT 2, NOT SLOT 1. The first version of this probe
# assumed slot 1 and read a completely different body; the raw RAM dump is what
# corrected it. Slot layout in this fixture: [patrol, patrol, scripted, scripted]
# (two hardware slots per placed enemy).
#
# WHAT EACH SUSPECT LOOKS LIKE IN THE LOG:
#   1. landing embedded  -> Y keeps GROWING after the body is already grounded,
#      or settles at a Y whose low nibble sits inside a tile instead of flush.
#   2. the tick JUMP integrates -> vy is seeded and immediately integrated, so
#      the first sample after a jump shows it already decremented.
#   3. TURN_AND_WALK on a ledge -> dx flips while X is still over solid floor.
#      If X first steps PAST the edge and only then flips, the turn cost a tick.
#
# Every line is flushed: a probe that dies mid-run must still leave evidence.

set OUT "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_probe/suspects.txt"
set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set POOL   0xD001
set STRIDE 28
set SLOT2  [expr {0xD001 + 2 * 28}]

set steps 0
set jumps 0
set falls 0
set samples 0
set armed 0

proc rb {a} { return [debug read memory $a] }
proc f {slot off} { return [rb [expr {$slot + $off}]] }

debug set_bp 0x611F {} { incr ::steps }
debug set_bp 0x63ED {} { incr ::jumps }
debug set_bp 0x63F6 {} { incr ::falls }
say "probe loaded, breakpoints set"

proc finish {why} {
    say "result=$why steps=$::steps jumps=$::jumps falls=$::falls samples=$::samples"
    close $::LOG
    exit
}

# ---- instrument check: refuse to measure until the room is really live -----
proc arm {} {
    global SLOT2
    set count [rb 0xD000]
    set mode  [f $SLOT2 13]
    if {$count < 3 || $mode != 14} {
        after time 0.25 arm
        return
    }
    set ::armed 1
    say "instrument OK: count=$count slot2.mode=$mode prog=[f $SLOT2 24] speed=[f $SLOT2 21] interval=[f $SLOT2 22]"
    say "bounds: minX=[f $SLOT2 4] maxX=[f $SLOT2 5] minY=[f $SLOT2 6] maxY=[f $SLOT2 7]"
    say ""
    say "  #    x   y  dx state timer  vy | steps jumps falls"
    after time 0.1 look
}

proc look {} {
    global SLOT2
    incr ::samples
    say [format "%3d  %3d %3d %3d  %4d %5d %3d | %5d %5d %5d" \
        $::samples [f $SLOT2 0] [f $SLOT2 1] [f $SLOT2 2] \
        [f $SLOT2 25] [f $SLOT2 26] [f $SLOT2 27] \
        $::steps $::jumps $::falls]
    if {$::samples >= 150} { finish "COMPLETE" }
    after time 0.12 look
}

after time 3.0 arm
after time 50.0 { if {!$::armed} { finish "FAILED-INSTRUMENT-never-armed" } }
