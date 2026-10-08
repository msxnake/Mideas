# Scenario probe for test/msx2-pursuer/pursuer_lab.json (4 rooms A-B-C-D), with assertions.
#
# It plays the lab through the REAL keyboard matrix from the first game-loop frame
# and ends with exactly one line:   VERDICT PASS   |   VERDICT FAIL: <tags>
#                                   VERDICT FAIL instrument: <why>
# "instrument" means the probe itself could not run (a symbol is missing, the main
# loop was not found, the boot never reached the game): never a timeout, never a pass.
#
# What each room proves (the numbers come from OpenMSX runs of the unmodified lab):
#   A  the player jumps to the apex of its fixed jump (minY 80) and lands on the low platform (y 96)
#   B  from below, a one-way platform is NOT crossed (head probe = bitmap_probe_floor): minY 129
#      [KNOWN-BEHAVIOUR: a change that lets the head through flips this on purpose]
#      from a solid ledge the player walks on the one-way platform (y 96)
#      N next to the carry_and_throw box picks it up (bitmap_carry_held = 1)
#   C  the room holds the soldier (bitmap_enemy_count = 2: a 16x32 body is two 16x16 layers) and it
#      patrols (its X changes within 2 s)
#      [KNOWN-BUG sink: the layers rest at y 160/176 = the lower 16 px sunk into the floor row; the
#       interpreter has a 16x16 body. A body that stands on the floor reads y 144/160 and only prints "FIXED"]
#      [KNOWN-CONTACT: the walk crosses the patrolling soldier once (today f=808, player x=74, health 5->4); it is logged as a DAMAGE line, not asserted]
#   D  a closed grille stops the player at x 148 (door flag 0); the latched pressure plate on the ledge
#      sets the flag to 1; afterwards the player walks through (x > 175)
#
# Damage is LOGGED, not asserted: the probe refills health/lives so the walk cannot end in a game over,
# but health and lives are read EVERY frame before the refill and each drop prints a "DAMAGE" line
# (room, position, frame). The refill cannot hide a hit that way.
#
# Inputs (environment):
#   MIDEAS_SYM          the .sym that matches the ROM being run (every address comes from it)
#   MIDEAS_OUT          result file
#   MIDEAS_SHOTS        1 = also save a screenshot per room next to MIDEAS_OUT (forces throttle on: with
#                       throttle off the captures lag a room behind)
#   MIDEAS_POOL_STRIDE  bytes per enemy-pool slot (default 30). The pool has no exported stride symbol; the
#                       probe checks that slot 1 is the second layer of the soldier and fails as "instrument"
#                       if the stride is stale, so a pool that grew cannot silently read garbage.

proc env_or {name default} {
    if {[info exists ::env($name)] && $::env($name) ne ""} { return $::env($name) }
    return $default
}

set SYM    [env_or MIDEAS_SYM ""]
set OUT    [env_or MIDEAS_OUT "pursuer_lab_probe_result.txt"]
set SHOTS  [env_or MIDEAS_SHOTS 0]
set STRIDE [env_or MIDEAS_POOL_STRIDE 30]

set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }
proc fail_instrument {why} {
    say "VERDICT FAIL instrument: $why"
    close $::LOG
    exit 2
}

# ---- symbols (Glass writes "name: equ 40C4H") -------------------------------
array set SYMS {}
if {$SYM eq "" || [catch {open $SYM r} fh]} { fail_instrument "cannot open the .sym (MIDEAS_SYM='$SYM')" }
while {[gets $fh line] >= 0} {
    if {[regexp {^(\S+): equ ([0-9A-Fa-f]+)H\s*$} $line -> name hex]} {
        scan $hex %x value
        set SYMS($name) $value
    }
}
close $fh
proc sym {name} {
    if {![info exists ::SYMS($name)]} { fail_instrument "missing symbol $name in $::SYM" }
    return $::SYMS($name)
}

set ENTRY    [sym .bitmap_main_loop]
set RET      [expr {$ENTRY + 3}]
set WAITVBL  [sym bitmap_wait_vblank]
set A_PY     [sym player_y]
set A_PX     [sym player_x]
set A_FLAGS  [sym player_flags]
set A_SCREEN [sym current_screen_index]
set A_ECOUNT [sym bitmap_enemy_count]
set A_EPOOL  [sym bitmap_enemy_pool]
set A_DOOR   [sym bitmap_key_door_open_flags]
set A_HEALTH [sym player_health]
set A_LIVES  [sym player_lives]
set A_CARRY  [sym bitmap_carry_held]

if {$SHOTS} { set throttle on } else { set throttle off }
set frameskip 0

proc rb {a} { return [debug read memory $a] }
proc key {row mask down} { if {$down} { keymatrixdown $row $mask } else { keymatrixup $row $mask } }
proc tapspace {} { keymatrixdown 8 0x01; after time 0.15 { keymatrixup 8 0x01 } }
proc shot {name} { if {$::SHOTS} { screenshot "$::OUT.$name.png" } }

# ---- assertions -------------------------------------------------------------
# Every tag must be evaluated; one that was never reached (the walk got stuck) counts as a failure.
set EXPECTED {A_apex A_low_platform B_oneway_from_below B_on_oneway B_carry_held
              C_enemy_count C_soldier_moves D_grille_blocks D_plate_opens D_passes_open_grille}
array set DONE {}
set failed {}
proc check {tag ok detail} {
    set ::DONE($tag) 1
    if {$ok} { say "ASSERT PASS $tag: $detail" } else { say "ASSERT FAIL $tag: $detail"; lappend ::failed $tag }
}

set started 0
set checked 0
set f 0
set st 0
set st_f 0
set keyR 0
set keyL 0
set keyJ 0
set miny 999
set ytrace {}
set soldier_x0 -1
set damage 0
set last_health -1
set last_lives -1

proc check_instrument {} {
    set b0 [rb $::ENTRY]
    set target [expr {[rb [expr {$::ENTRY + 1}]] + 256 * [rb [expr {$::ENTRY + 2}]]}]
    say [format "instrument: CALL byte=%02X target=%04X expected %04X pc=%04X" $b0 $target $::WAITVBL [reg pc]]
    if {$b0 != 0xCD || $target != $::WAITVBL} {
        fail_instrument [format "the main-loop entry %04X is not CALL bitmap_wait_vblank (byte %02X, target %04X, expected %04X)" $::ENTRY $b0 $target $::WAITVBL]
    }
    set ::checked 1
}
proc setkeys {r l j} {
    if {$r != $::keyR} { key 8 0x80 $r; set ::keyR $r }
    if {$l != $::keyL} { key 8 0x10 $l; set ::keyL $l }
    if {$j != $::keyJ} { key 8 0x01 $j; set ::keyJ $j }
}
proc slot {n off} { return [rb [expr {$::A_EPOOL + $n * $::STRIDE + $off}]] }
proc pool {n} {
    set s ""
    for {set i 0} {$i < $n} {incr i} { append s [format "%02X " [rb [expr {$::A_EPOOL + $i}]]] }
    return $s
}
proc obs {tag} {
    say [format "obs %s f=%d screen=%d x=%d y=%d flags=%02X ecount=%d door0=%d held=%d health=%d" $tag $::f [rb $::A_SCREEN] [rb $::A_PX] [rb $::A_PY] [rb $::A_FLAGS] [rb $::A_ECOUNT] [rb $::A_DOOR] [rb $::A_CARRY] [rb $::A_HEALTH]]
}
proc goto {n} { set ::st $n; set ::st_f $::f }

# Health and lives are read every frame; a drop is logged and then refilled.
proc watch_damage {} {
    set h [rb $::A_HEALTH]
    set l [rb $::A_LIVES]
    if {$::last_health >= 0 && ($h < $::last_health || $l < $::last_lives)} {
        incr ::damage
        say [format "DAMAGE #%d f=%d screen=%d x=%d y=%d health %d->%d lives %d->%d" $::damage $::f [rb $::A_SCREEN] [rb $::A_PX] [rb $::A_PY] $::last_health $h $::last_lives $l]
    }
    if {$h < 5} { debug write memory $::A_HEALTH 5; set h 5 }
    if {$l < 9} { debug write memory $::A_LIVES 9; set l 9 }
    set ::last_health $h
    set ::last_lives $l
}

# ---- the scenario (one state machine; `dt` = frames since the state began) ----
proc scenario {} {
    set dt [expr {$::f - $::st_f}]
    set x [rb $::A_PX]
    set y [rb $::A_PY]
    set scr [rb $::A_SCREEN]
    watch_damage
    switch $::st {
        0 { setkeys 0 0 0
            if {$dt == 5} { obs "A_start" }
            if {$dt >= 60} { obs "A_settled"; goto 1 } }
        1 { setkeys 1 0 0
            if {$x >= 44} { obs "A_at44"; goto 2 } }
        2 { setkeys [expr {$dt < 30}] 0 [expr {$dt < 4}]
            if {$y < $::miny} { set ::miny $y }
            lappend ::ytrace "$dt:$x/$y"
            if {$dt >= 70} {
                obs "A_after_jump(minY=$::miny)"; shot A
                say "trace A: $::ytrace"; set ::ytrace {}
                check A_apex [expr {$::miny == 80}] "minY=$::miny, expected 80 (the fixed 64 px jump from y 144)"
                setkeys 0 0 0; goto 3
            } }
        3 { setkeys 0 0 0
            if {$dt == 20} {
                obs "A_standing_on_low_platform"
                check A_low_platform [expr {$y == 96}] "y=$y, expected 96"
                set ::miny 999; goto 4
            } }
        4 { setkeys 1 0 0
            if {$scr == 1} { goto 5 }
            if {$dt > 600} { obs "A_to_B_timeout"; goto 99 } }
        5 { setkeys 0 0 0
            if {$dt == 40} { obs "B_arrived"; goto 6 } }
        6 { setkeys 1 0 0
            if {$x >= 124} { obs "B_under_oneway_x124"; setkeys 0 0 0; set ::miny 999; set ::ytrace {}; goto 7 } }
        7 { setkeys 0 0 [expr {$dt >= 10 && $dt < 14}]
            if {$dt > 10 && $y < $::miny} { set ::miny $y }
            lappend ::ytrace "$dt:$y"
            if {$dt >= 70} {
                obs "B_jump_from_below_oneway(minY=$::miny)"
                say "trace B-under: $::ytrace"; set ::ytrace {}
                check B_oneway_from_below [expr {$::miny == 129}] "minY=$::miny, expected 129 (80 would mean the one-way platform was crossed from below)"
                if {$::miny == 129} { say "KNOWN-BEHAVIOUR one-way: not crossable from below (bitmap_try_move_y uses bitmap_probe_floor as head probe); reaching it needs an adjacent solid ledge" }
                goto 71
            } }
        71 { setkeys 0 1 0
            if {$x <= 28} { obs "B_at28"; setkeys 0 0 0; set ::miny 999; goto 72 } }
        72 { setkeys [expr {$dt < 30}] 0 [expr {$dt >= 5 && $dt < 9}]
            if {$y < $::miny} { set ::miny $y }
            lappend ::ytrace "$dt:$x/$y"
            if {$dt >= 70} { obs "B_after_jump_onto_ledge(minY=$::miny)"; say "trace B-ledge: $::ytrace"; set ::ytrace {}; goto 73 } }
        73 { setkeys 1 0 0
            if {$x >= 132} { obs "B_walking_on_oneway"; setkeys 0 0 0; goto 74 } }
        74 { setkeys 0 0 0
            if {$dt == 20} {
                obs "B_standing_on_oneway"; shot B
                check B_on_oneway [expr {$y == 96}] "y=$y, expected 96"
                goto 75
            } }
        75 { setkeys 1 0 0
            if {$x >= 176 && $y == 144} { obs "B_next_to_box"; setkeys 0 0 0; goto 76 } }
        76 { if {$dt == 3} { key 4 0x08 1 }
            if {$dt == 7} { key 4 0x08 0 }
            if {$dt == 25} {
                obs "B_carry_attempt"; shot B_carry
                set held [rb $::A_CARRY]
                check B_carry_held [expr {$held == 1}] "bitmap_carry_held=$held after N, expected 1"
                goto 8
            } }
        8 { setkeys 1 0 0
            if {$scr == 2} { goto 9 }
            if {$dt > 800} { obs "B_to_C_timeout"; goto 99 } }
        9 { setkeys 0 0 0
            if {$dt == 5} {
                obs "C_arrived"; say "pool@C_arrival: [pool 48]"
                set ::soldier_x0 [slot 0 0]
                # The pool stride is hardcoded: make sure slot 1 really is the second layer of slot 0.
                if {[slot 1 0] != [slot 0 0] || [slot 1 1] != [slot 0 1] + 16} {
                    fail_instrument [format "enemy pool stride %d is stale: slot0 x=%d y=%d, slot1 x=%d y=%d (the second layer must share x and sit 16 px lower); set MIDEAS_POOL_STRIDE" $::STRIDE [slot 0 0] [slot 0 1] [slot 1 0] [slot 1 1]]
                }
            }
            if {$dt == 125} {
                obs "C_after_2s"; say "pool@C_after_2s: [pool 48]"; shot C
                set ec [rb $::A_ECOUNT]
                set x1 [slot 0 0]
                check C_enemy_count [expr {$ec == 2}] "bitmap_enemy_count=$ec, expected 2 (one soldier = two layers)"
                check C_soldier_moves [expr {$x1 != $::soldier_x0}] "soldier x $::soldier_x0 -> $x1 within 2 s"
                set y0 [slot 0 1]
                set y1 [slot 1 1]
                if {$y0 == 160 && $y1 == 176} {
                    say "KNOWN-BUG sink: soldier layers at y=$y0/$y1, the lower 16 px are inside the floor row (a standing body reads 144/160)"
                } else {
                    say "sink: soldier layers at y=$y0/$y1 (no longer the known 160/176)[expr {$y0 == 144 && $y1 == 160 ? { - FIXED: standing on the floor} : {}}]"
                }
                goto 10
            } }
        10 { setkeys 1 0 0
            if {$scr == 3} { goto 11 }
            if {$dt > 900} { obs "C_to_D_timeout"; goto 99 } }
        11 { setkeys 1 0 0
            if {$dt == 90} {
                obs "D_pressing_right_against_closed_grille"; shot D_closed
                set d0 [rb $::A_DOOR]
                check D_grille_blocks [expr {$x == 148 && $d0 == 0}] "x=$x door0=$d0, expected x=148 door0=0"
                goto 12
            } }
        12 { setkeys 0 1 0
            if {$x <= 12} { obs "D_at_west_wall_x12"; setkeys 0 0 0; set ::miny 999; set ::ytrace {}; goto 13 } }
        13 { setkeys [expr {$dt < 28}] 0 [expr {$dt >= 5 && $dt < 9}]
            if {$y < $::miny} { set ::miny $y }
            lappend ::ytrace "$dt:$x/$y"
            if {$dt >= 70} {
                obs "D_after_jump_onto_plate_ledge(minY=$::miny)"; say "trace D-ledge: $::ytrace"
                set d0 [rb $::A_DOOR]
                check D_plate_opens [expr {$d0 == 1}] "door0=$d0 after the plate ledge, expected 1"
                goto 14
            } }
        14 { setkeys 1 0 0
            if {$x >= 110} { obs "D_walked_off_ledge"; goto 15 } }
        15 { setkeys 1 0 0
            if {$dt == 150} {
                obs "D_after_walking_through_open_grille"
                set d0 [rb $::A_DOOR]
                check D_passes_open_grille [expr {$x > 175 && $d0 == 1}] "x=$x door0=$d0, expected x>175 door0=1"
                goto 99
            } }
        99 { finish }
    }
}

debug set_bp $ENTRY {} {
    if {!$::checked} { check_instrument }
    set ::started 1
}
debug set_bp $RET {} {
    if {!$::started} { return }
    incr ::f
    scenario
    if {$::f > 4000} { say "scenario did not finish in 4000 frames (state $::st)"; finish }
}
proc finish {} {
    say "damage events: $::damage (logged above as DAMAGE lines)"
    set why {}
    foreach tag $::failed { lappend why $tag }
    foreach tag $::EXPECTED { if {![info exists ::DONE($tag)]} { lappend why "$tag(not reached, state $::st)" } }
    if {[llength $why]} { say "VERDICT FAIL: [join $why {; }]" } else { say "VERDICT PASS" }
    close $::LOG
    exit
}
set boot_n 0
proc boot_tick {} {
    if {$::started} { return }
    incr ::boot_n
    tapspace
    if {$::boot_n > 100} { fail_instrument "the game loop was never reached after 100 SPACE taps (boot stuck in the GameFlow?)" }
    after time 1.2 boot_tick
}
after time 1.0 boot_tick
after time 300 { fail_instrument [format "no verdict after 300 emulated seconds (f=%d st=%d started=%d)" $::f $::st $::started] }
