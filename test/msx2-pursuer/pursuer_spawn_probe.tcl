# Pursuer soldier: does it appear where the player came in, after the countdown, in ONE frame, and only when the player is away?
#
# One OpenMSX run = one case against one ROM of test/msx2-pursuer/pursuer_alert_lab.json (rooms A - B - C - D, alert zones in B and C,
# 2 s countdown = 120 frames, guard 32 px):
#   a  start in A, walk east into B (the soldier's door is B's west side), move 32+ px away and wait.
#      Run with MIDEAS_DELAY_FRAMES=300 against a lab built with --delay 5 it is the LONG-DELAY run: a countdown above 255 frames
#      needs the high byte of the 16-bit timer (a byte-wide decrement never reaches zero there).
#   b  same entry, but stand still ON the door: the soldier must NOT appear while the player is < guard away, even after the
#      countdown has ended, and must appear within 2 frames of the player stepping away.
#   c  start in D, walk west into C: the entry door is C's EAST side (x = 238), then move away and wait.
#   d  boot (GameFlow WorldLink) straight into C: the BOOT-init path of the hook, not the room-commit one.
#   e  A -> B, the soldier appears, back to A (walking through the soldier with i-frames held), B again: a second entry must re-arm the
#      countdown from scratch (state 1, full timer, hidden and parked slots) and the soldier must appear again after 120 +-1 frames.
#      Every check of rounds 1 and 2 is reported with the suffix _r1 / _r2.
#
# What is measured, and why it can be trusted:
#   frame     one pass of the main loop = one hit of the breakpoint on `.bitmap_main_loop`. Never wall-clock time.
#   sample    taken at the entry of bitmap_update_enemies, i.e. AFTER the pursuer tick of that frame and BEFORE the enemy update, so the
#             pool still holds exactly what the tick wrote (the known 16 px sinking of a 16x32 body under the 16x16 interpreter has not
#             happened yet). The instrument check proves that the call just before it is `call bitmap_pursuer_tick`.
#   init      breakpoint on bitmap_pursuer_init: the frame, the sample count, the room and the player position at the moment the room
#             hook ran. The keys are released right there, so the player does not move between the hook and the first sample.
#   Every address comes from the .sym of THIS rom (MIDEAS_SYM); a missing symbol is "FAIL instrument", never a guess.
#
# Checks of every round (see round_checks):
#   init_hook_ran, entry_matches_hook, entry_sample_is_next_after_init, entry_is_player_at_first_sample (player_x/y == entry_x/y in the
#   first sample after the init that armed the countdown; in case d also entry == MIDEAS_SPAWN), armed_at_entry (state 1, timer
#   DELAY..DELAY+1, both modes #FF, slots parked), hidden_parked (every sample while hidden: y >= 192 in every soldier slot), never_torn,
#   appeared, delay_frames, leader_at_entry, follower_below_leader, player_away, slot_count, state_after, entry_is_*_door.
#
# Verdict lines: "CHECK name=... PASS|FAIL detail" and one "RESULT case=<c> PASS|FAIL". Environment:
#   MIDEAS_SYM  .sym of the ROM        MIDEAS_OUT  result file        MIDEAS_CASE  a|b|c|d|e
#   MIDEAS_DELAY_FRAMES (default 120)  MIDEAS_GUARD (default 32)      MIDEAS_MAX_FRAMES (default 1500)
#   MIDEAS_SPAWN x,y  boot spawn of the project (default 32,144, the alert lab's), checked in case d
#   MIDEAS_DIR  right|left: which way case d walks away from the boot spawn (default right; a big project whose spawn is at the east edge needs left)

proc env_or {name default} {
    if {[info exists ::env($name)] && $::env($name) ne ""} { return $::env($name) }
    return $default
}

set SYM   [env_or MIDEAS_SYM ""]
set OUT   [env_or MIDEAS_OUT "pursuer_spawn_probe_result.txt"]
set CASE  [env_or MIDEAS_CASE a]
set DELAY [env_or MIDEAS_DELAY_FRAMES 120]
set GUARD [env_or MIDEAS_GUARD 32]
set MAXF  [env_or MIDEAS_MAX_FRAMES 1500]
set DIR   [env_or MIDEAS_DIR right]
set SPAWN [env_or MIDEAS_SPAWN "32,144"]
lassign [split $SPAWN ,] SPAWN_X SPAWN_Y

set LOG [open $OUT w]
set throttle off   ;# all timing is emulated time (machine_info time) or frame counts: nothing depends on wall-clock speed
proc say {s} { puts $::LOG $s; flush $::LOG }
proc finish_now {} { close $::LOG; exit }
proc fail_instrument {msg} {
    say "CHECK name=instrument FAIL $msg"
    say "RESULT case=$::CASE FAIL (instrument)"
    finish_now
}

# ---- symbols (Glass: "name: equ 40C4H") --------------------------------------------------------------------------------------
array set SYMS {}
if {$SYM eq "" || [catch {set fh [open $SYM r]}]} { fail_instrument "cannot open sym file '$SYM'" }
while {[gets $fh line] >= 0} {
    if {[regexp {^(\S+): equ ([0-9A-Fa-f]+)H\s*$} $line -> name hex]} { scan $hex %x v; set SYMS($name) $v }
}
close $fh
proc sym {name} {
    if {![info exists ::SYMS($name)]} { fail_instrument "missing symbol $name in $::SYM" }
    return $::SYMS($name)
}
set A_POOL     [sym bitmap_enemy_pool]
set A_COUNT    [sym bitmap_enemy_count]
set A_SCREEN   [sym current_screen_index]
set A_PX       [sym player_x]
set A_PY       [sym player_y]
set A_INVULN   [sym player_invuln]
set A_STATE    [sym bitmap_pursuer_state]
set A_TIMER    [sym bitmap_pursuer_timer]
set A_ENTRY_X  [sym bitmap_pursuer_entry_x]
set A_ENTRY_Y  [sym bitmap_pursuer_entry_y]
set A_UPD      [sym bitmap_update_enemies]
set A_INIT     [sym bitmap_pursuer_init]
set A_TICK     [sym bitmap_pursuer_tick]
set A_LOOP     [sym .bitmap_main_loop]
set A_WAIT     [sym bitmap_wait_vblank]
set STRIDE     [sym BITMAP_PURSUER_POOL_STRIDE]
set NSLOTS     [sym BITMAP_PURSUER_SLOTS]
set MODE_OFS   13
set MODE_SCRIPTED 14
set MODE_FOLLOWER 15
set MODE_HIDDEN   255
set PARK_MIN_Y    192   ;# a hidden slot must sit at or below the last visible line

proc rb {a} { return [debug read memory $a] }
proc rw {a} { return [expr {[debug read memory $a] + 256 * [debug read memory [expr {$a + 1}]]}] }
proc key {row mask down} { if {$down} { keymatrixdown $row $mask } else { keymatrixup $row $mask } }
proc tapspace {} { keymatrixdown 8 0x01; after time 0.15 { keymatrixup 8 0x01 } }
set keyR 0
set keyL 0
proc setkeys {r l} {
    if {$r != $::keyR} { key 8 0x80 $r; set ::keyR $r }
    if {$l != $::keyL} { key 8 0x10 $l; set ::keyL $l }
}
proc slot {i field} { return [rb [expr {$::A_POOL + $i * $::STRIDE + $field}]] }
proc iabs {v} { return [expr {$v < 0 ? -$v : $v}] }

say "case=$CASE delay=$DELAY guard=$GUARD stride=$STRIDE slots=$NSLOTS spawn=$SPAWN_X,$SPAWN_Y sym=$SYM"
say [format "loop=%04X upd=%04X init=%04X tick=%04X pool=%04X" $A_LOOP $A_UPD $A_INIT $A_TICK $A_POOL]

# ---- state -------------------------------------------------------------------------------------------------------------------
set iters 0                 ;# main-loop passes since the first one
set n 0                     ;# samples (== passes that reached the enemy update)
set started 0
set checked 0
set inits {}                ;# list of {iters screen player_x player_y n} per bitmap_pursuer_init hit
set phase 0
set phase_n 0
set start_screen -1
set round 1                 ;# case e runs two rounds (A -> B, then B again); every other case has one
set checks_failed 0
set done 0
# per-round state (reset_round)
set entry_n -1              ;# sample number of the first sample after the relevant init
set entry_iters -1
set entry_screen -1
set entry_px -1             ;# player position at the init hook
set entry_py -1
set entry_sample {}         ;# {player_x player_y state timer mode0 mode1 min_slot_y ram_entry_x ram_entry_y} read in that first sample
set entry_init_n -1         ;# sample count at the init hook that preceded it
set torn {}
set appear_n -1
set appear {}
set hidden_min_y 999        ;# lowest slot y seen in any sample while the soldier was hidden
set hidden_samples 0
set hidden_min_where ""
# case b only
set cross_n -1
set cross_iters -1
set early_appear ""
set waiting_state -1
set waiting_timer -1
set waiting_proof ""

proc reset_round {} {
    set ::entry_n -1
    set ::entry_iters -1
    set ::entry_screen -1
    set ::entry_px -1
    set ::entry_py -1
    set ::entry_sample {}
    set ::entry_init_n -1
    set ::torn {}
    set ::appear_n -1
    set ::appear {}
    set ::hidden_min_y 999
    set ::hidden_samples 0
    set ::hidden_min_where ""
}

proc check {name ok detail} {
    if {!$ok} { incr ::checks_failed }
    say [format "CHECK name=%s %s %s" $name [expr {$ok ? "PASS" : "FAIL"}] $detail]
}

proc classify {} {
    set m0 [slot 0 $::MODE_OFS]
    set m1 [slot 1 $::MODE_OFS]
    if {$m0 == $::MODE_HIDDEN && $m1 == $::MODE_HIDDEN} { return hidden }
    if {$m0 == $::MODE_SCRIPTED && $m1 == $::MODE_FOLLOWER} { return out }
    return torn
}

# lowest y over every soldier slot (the slots of a parked soldier all sit below the room)
proc min_slot_y {} {
    set lo 999
    for {set i 0} {$i < $::NSLOTS} {incr i} {
        set y [slot $i 1]
        if {$y < $lo} { set lo $y }
    }
    return $lo
}

# The ROM must be what the probe assumes: the main loop starts with `call bitmap_wait_vblank`, and the call that ends in
# bitmap_update_enemies is immediately preceded by `call bitmap_pursuer_tick`.
proc check_instrument {} {
    set b0 [rb $::A_LOOP]
    set target [expr {[rb [expr {$::A_LOOP + 1}]] + 256 * [rb [expr {$::A_LOOP + 2}]]}]
    if {$b0 != 0xCD || $target != $::A_WAIT} {
        fail_instrument [format "%04X is not 'call bitmap_wait_vblank' (bytes %02X -> %04X)" $::A_LOOP $b0 $target]
    }
    set sp [reg SP]
    set ret [expr {[rb $sp] + 256 * [rb [expr {$sp + 1}]]}]
    set op_upd [rb [expr {$ret - 3}]]
    set to_upd [expr {[rb [expr {$ret - 2}]] + 256 * [rb [expr {$ret - 1}]]}]
    set op_tick [rb [expr {$ret - 6}]]
    set to_tick [expr {[rb [expr {$ret - 5}]] + 256 * [rb [expr {$ret - 4}]]}]
    if {$op_upd != 0xCD || $to_upd != $::A_UPD} {
        fail_instrument [format "update_enemies was not reached by a call at %04X (bytes %02X -> %04X)" [expr {$ret - 3}] $op_upd $to_upd]
    }
    if {$op_tick != 0xCD || $to_tick != $::A_TICK} {
        fail_instrument [format "no 'call bitmap_pursuer_tick' right before the enemy update (bytes %02X -> %04X, expected %04X)" $op_tick $to_tick $::A_TICK]
    }
    set ::checked 1
    say [format "instrument OK: main loop at %04X; call bitmap_pursuer_tick at %04X, call bitmap_update_enemies at %04X" $::A_LOOP [expr {$ret - 6}] [expr {$ret - 3}]]
}

# ---- breakpoints -------------------------------------------------------------------------------------------------------------
debug set_bp $A_LOOP {} { incr ::iters }
debug set_bp $A_INIT {} {
    lappend ::inits [list $::iters [rb $::A_SCREEN] [rb $::A_PX] [rb $::A_PY] $::n]
    # Hold the player still from the hook to the first sample: the position read there is then the one the hook saw (a held key would
    # move the player two pixels in between and blur the comparison). The scenario presses its keys again in that first sample.
    setkeys 0 0
}
debug set_bp $A_UPD {} { on_sample }

# boot: tap SPACE until the game loop runs (harmless: the player is not in control before it)
set boot_n 0
proc boot_tick {} {
    if {$::started} { return }
    incr ::boot_n
    tapspace
    if {$::boot_n > 100} { say "RESULT case=$::CASE FAIL (game loop never reached)"; finish_now }
    after time 1.2 boot_tick
}
after time 1.0 boot_tick

proc dist_from_entry {} {
    set dx [iabs [expr {[rb $::A_PX] - $::entry_px}]]
    set dy [iabs [expr {[rb $::A_PY] - $::entry_py}]]
    return [list $dx $dy]
}
proc is_far {} {
    lassign [dist_from_entry] dx dy
    return [expr {$dx >= $::GUARD || $dy >= $::GUARD}]
}

proc on_sample {} {
    if {$::done} { return }
    if {!$::checked} { check_instrument; set ::started 1 }
    incr ::n
    set screen [rb $::A_SCREEN]
    if {$::start_screen < 0} { set ::start_screen $screen }
    set cls [classify]
    if {$::entry_n >= 0 && $cls eq "torn"} {
        lappend ::torn [format "n=%d iters=%d m0=%d m1=%d" $::n $::iters [slot 0 $::MODE_OFS] [slot 1 $::MODE_OFS]]
        # a half-written body is already a verdict: look at it for 3 more frames, then stop instead of waiting for the timeout
        if {[llength $::torn] == 1 && $::phase != 99} { setkeys 0 0; set ::phase 99; set ::phase_n $::n }
    }
    # keep the player alive for as long as the scenario lasts
    if {$::n % 20 == 0} { debug write memory [sym player_health] 5; debug write memory [sym player_lives] 9 }
    # case e walks back THROUGH the soldier: i-frames held, so the contact is not what the probe measures
    if {$::CASE eq "e" && $::round == 2 && $::entry_n < 0} { debug write memory $::A_INVULN 255 }

    if {$::n > $::MAXF} { conclude "timeout after $::MAXF samples (round $::round, phase $::phase)"; return }

    # The room entry: the first sample after an init hook that LEFT THE COUNTDOWN ARMED (state 1). a, b and c run the boot init in a room
    # with no alert first (it leaves state 0) and only later enter the alert room; d arms the countdown in the boot init itself.
    if {$::entry_n < 0 && [llength $::inits] > 0 && [rb $::A_STATE] == 1} {
        lassign [lindex $::inits end] it scr px py init_n
        set ::entry_n $::n
        set ::entry_iters $it
        set ::entry_screen [rb $::A_SCREEN]
        set ::entry_px $px
        set ::entry_py $py
        set ::entry_init_n $init_n
        # Everything the first sample after the arming init can say about the arming: where the player is, what the countdown holds,
        # whether the soldier slots are hidden AND parked.
        set ::entry_sample [list [rb $::A_PX] [rb $::A_PY] [rb $::A_STATE] [rw $::A_TIMER] [slot 0 $::MODE_OFS] [slot 1 $::MODE_OFS] [min_slot_y] [rb $::A_ENTRY_X] [rb $::A_ENTRY_Y]]
    }

    # While the soldier is hidden its slots must stay parked below the room (the pressure plates and ENEMY_AHEAD do not skip mode #FF).
    if {$::entry_n >= 0 && $cls eq "hidden"} {
        incr ::hidden_samples
        set y [min_slot_y]
        if {$y < $::hidden_min_y} { set ::hidden_min_y $y; set ::hidden_min_where "sample $::n (entry+[expr {$::n - $::entry_n}])" }
    }

    switch $::CASE {
        a { scenario_walk_in_and_wait right }
        b { scenario_stand_then_leave }
        c { scenario_walk_in_and_wait left }
        d { scenario_boot_and_wait }
        e { if {$::round == 1} { scenario_walk_in_and_wait right } else { scenario_return_and_reenter } }
    }

    # appearance: the first sample whose body is complete
    if {$::entry_n >= 0 && $::appear_n < 0 && $cls eq "out"} {
        set ::appear_n $::n
        set ::appear [list $::iters [slot 0 0] [slot 0 1] [slot 1 0] [slot 1 1] [rb $::A_PX] [rb $::A_PY] [rb $::A_STATE] [rb $::A_COUNT] [rb $::A_ENTRY_X] [rb $::A_ENTRY_Y] [rb $::A_SCREEN]]
        setkeys 0 0
        # let two more frames pass so a re-hide or a half-written body would show up in `torn`
        set ::phase 99
        set ::phase_n $::n
    }
    if {$::phase == 99 && ($::n - $::phase_n) >= 3} {
        if {$::CASE eq "e" && $::round == 1} { end_round_one } else { conclude "" }
    }
}

proc scenario_walk_in_and_wait {dir} {
    set r [expr {$dir eq "right"}]
    set l [expr {$dir eq "left"}]
    switch $::phase {
        0 { if {$::n >= 30} { set ::phase 1; set ::phase_n $::n } }
        1 { setkeys $r $l
            if {$::entry_n >= 0} { set ::phase 2; set ::phase_n $::n } }
        2 { setkeys $r $l
            if {[is_far]} { setkeys 0 0; set ::phase 3; set ::phase_n $::n } }
        3 { setkeys 0 0 }
    }
}

proc scenario_stand_then_leave {} {
    switch $::phase {
        0 { if {$::n >= 30} { set ::phase 1; set ::phase_n $::n } }
        1 { setkeys 1 0
            if {$::entry_n >= 0} { setkeys 0 0; set ::phase 2; set ::phase_n $::n } }
        2 { # standing on the door: nothing may appear, countdown or not
            setkeys 0 0
            if {[classify] ne "hidden"} { set ::early_appear "n=[expr {$::n - $::entry_n}]"; set ::phase 3; return }
            if {($::n - $::entry_n) >= ($::DELAY + 60)} {
                set ::waiting_proof [format "state=%d timer=%d player_dist=%s hidden_for=%d" [rb $::A_STATE] [rw $::A_TIMER] [dist_from_entry] [expr {$::n - $::entry_n}]]
                set ::waiting_state [rb $::A_STATE]
                set ::waiting_timer [rw $::A_TIMER]
                set ::phase 3; set ::phase_n $::n
            } }
        3 { setkeys 1 0
            if {$::cross_n < 0 && [is_far]} { set ::cross_n $::n; set ::cross_iters $::iters } }
    }
}

proc scenario_boot_and_wait {} {
    switch $::phase {
        0 { if {$::n >= 5} { set ::phase 2; set ::phase_n $::n } }
        2 { if {$::entry_n >= 0} { setkeys [expr {$::DIR eq "right"}] [expr {$::DIR eq "left"}] }
            if {$::entry_n >= 0 && [is_far]} { setkeys 0 0; set ::phase 3; set ::phase_n $::n } }
        3 { setkeys 0 0 }
    }
}

# Case e, round 2: the soldier is out in B. Walk west through its door back into A, settle, then walk east into B again.
proc scenario_return_and_reenter {} {
    switch $::phase {
        10 { # west, until the room is A again
            setkeys 0 1
            if {[rb $::A_SCREEN] == $::start_screen} { setkeys 0 0; set ::phase 11; set ::phase_n $::n } }
        11 { setkeys 0 0
            if {($::n - $::phase_n) >= 10} { set ::phase 12 } }
        12 { # east, back into B (A's east edge is where the player stands)
            setkeys 1 0
            if {$::entry_n >= 0} { set ::phase 13; set ::phase_n $::n } }
        13 { setkeys 1 0
            if {[is_far]} { setkeys 0 0; set ::phase 3; set ::phase_n $::n } }
        3 { setkeys 0 0 }
    }
}

proc end_round_one {} {
    round_checks _r1
    # round 2: out of B through the west door, then in again. The per-round state starts from scratch; `inits`, `n` and `iters` go on.
    set ::round 2
    reset_round
    set ::phase 10
    set ::phase_n $::n
}

# ---- verdicts -----------------------------------------------------------------------------------------------------------------
# All the checks that one entry-to-appearance round must satisfy. `sfx` is "" for the single-round cases and _r1 / _r2 for case e.
proc round_checks {sfx} {
    say [format "-- round%s: start_screen=%d entry: n=%d iters=%d screen=%d player at the hook=(%d,%d)" $sfx $::start_screen $::entry_n $::entry_iters $::entry_screen $::entry_px $::entry_py]
    check init_hook_ran$sfx [expr {$::entry_n >= 0}] "inits=[llength $::inits] armed_entry=[expr {$::entry_n >= 0}]"
    if {$::entry_n >= 0} {
        check entry_matches_hook$sfx [expr {[rb $::A_ENTRY_X] == $::entry_px && [rb $::A_ENTRY_Y] == $::entry_py}] \
            [format "RAM entry=(%d,%d) player at init=(%d,%d)" [rb $::A_ENTRY_X] [rb $::A_ENTRY_Y] $::entry_px $::entry_py]
        # --- the first sample after the arming init ---
        check entry_sample_is_next_after_init$sfx [expr {$::entry_n - $::entry_init_n == 1}] "init at sample count $::entry_init_n, first armed sample $::entry_n"
        lassign $::entry_sample spx spy sstate stimer sm0 sm1 symin sex sey
        # The hook stores the player position as the soldier's entry point; the player is final by then or the soldier comes out
        # somewhere the player never was (the boot hook placed before "Place the player" gives 255,0; the lift loader moves it after).
        check entry_is_player_at_first_sample$sfx [expr {$spx == $sex && $spy == $sey}] "player=($spx,$spy) entry_x/y=($sex,$sey) in the first sample after the init"
        if {$::CASE eq "d"} {
            check entry_is_spawn$sfx [expr {$sex == $::SPAWN_X && $sey == $::SPAWN_Y}] "entry=($sex,$sey) boot spawn=($::SPAWN_X,$::SPAWN_Y) (MIDEAS_SPAWN)"
        }
        check armed_at_entry$sfx [expr {$sstate == 1 && $stimer >= $::DELAY && $stimer <= $::DELAY + 1 && $sm0 == $::MODE_HIDDEN && $sm1 == $::MODE_HIDDEN && $symin >= $::PARK_MIN_Y}] \
            "first sample: state=$sstate timer=$stimer (expected $::DELAY..[expr {$::DELAY + 1}]) modes=$sm0/$sm1 (expected $::MODE_HIDDEN/$::MODE_HIDDEN) lowest slot y=$symin (expected >= $::PARK_MIN_Y)"
        check hidden_parked$sfx [expr {$::hidden_samples > 0 && $::hidden_min_y >= $::PARK_MIN_Y}] \
            "$::hidden_samples hidden samples; lowest slot y while hidden = $::hidden_min_y at $::hidden_min_where (expected >= $::PARK_MIN_Y: below the visible room)"
    }
    check never_torn$sfx [expr {[llength $::torn] == 0}] "torn samples (leader/follower modes neither both $::MODE_HIDDEN nor $::MODE_SCRIPTED/$::MODE_FOLLOWER): [llength $::torn], first: [lrange $::torn 0 1]"
    check appeared$sfx [expr {$::appear_n >= 0}] "appear_n=$::appear_n"
    if {$::appear_n >= 0} {
        lassign $::appear a_iters x0 y0 x1 y1 apx apy a_state a_count ex ey a_screen
        set hidden_frames [expr {$a_iters - $::entry_iters}]
        if {$::CASE ne "b"} {
            # b keeps the player on the door on purpose, so there the soldier is held back well past the countdown.
            check delay_frames$sfx [expr {$hidden_frames >= $::DELAY - 1 && $hidden_frames <= $::DELAY + 1}] \
                "hidden $hidden_frames frames after the entry (expected $::DELAY +-1; entry_iters=$::entry_iters appear_iters=$a_iters)"
        } else {
            say "hidden $hidden_frames frames after the entry (case b: held back by the guard, the countdown was $::DELAY)"
        }
        check leader_at_entry$sfx [expr {$x0 == $ex && $y0 == $ey}] "leader=($x0,$y0) entry=($ex,$ey)"
        check follower_below_leader$sfx [expr {$x1 == $ex && $y1 == $ey + 16}] "follower=($x1,$y1) expected ($ex,[expr {$ey + 16}])"
        check same_frame_complete$sfx 1 "the appearance sample already had modes $::MODE_SCRIPTED/$::MODE_FOLLOWER in both slots and both positions (classified before anything else ran)"
        set dx [iabs [expr {$apx - $ex}]]
        set dy [iabs [expr {$apy - $ey}]]
        check player_away$sfx [expr {$dx >= $::GUARD || $dy >= $::GUARD}] "player=($apx,$apy) entry=($ex,$ey) |dx|=$dx |dy|=$dy guard=$::GUARD"
        check slot_count$sfx [expr {$a_count == $::NSLOTS}] "bitmap_enemy_count=$a_count soldier slots=$::NSLOTS"
        check state_after$sfx [expr {$a_state == 0}] "bitmap_pursuer_state=$a_state after appearing"
        if {$::CASE eq "c"} { check entry_is_east_door$sfx [expr {$ex >= 230}] "entry x=$ex (C is entered by its east side)" }
        if {$::CASE eq "a" || $::CASE eq "b" || $::CASE eq "e"} { check entry_is_west_door$sfx [expr {$ex <= 8}] "entry x=$ex (B is entered by its west side)" }
        say [format "appearance%s: iters=%d player=(%d,%d) leader=(%d,%d) follower=(%d,%d) entry=(%d,%d) screen=%d" $sfx $a_iters $apx $apy $x0 $y0 $x1 $y1 $ex $ey $a_screen]
    }
}

proc conclude {why} {
    if {$::done} { return }
    set ::done 1
    setkeys 0 0
    say "-- inits (iters screen player_x player_y sample_count): $::inits"
    if {$why ne ""} { check timeout 0 $why }
    round_checks [expr {$::CASE eq "e" ? "_r$::round" : ""}]
    if {$::CASE eq "e"} {
        # the second entry really was a second one: the hook ran again, in the alert room, after a trip through the other room
        set alert_inits 0
        foreach i $::inits { if {[lindex $i 1] == $::entry_screen} { incr alert_inits } }
        check reentered_the_alert_room [expr {$::round == 2 && $alert_inits >= 2}] "round=$::round, hook calls in the alert room (screen $::entry_screen) = $alert_inits"
    }
    if {$::CASE eq "b"} {
        check stayed_hidden_on_the_door [expr {$::early_appear eq ""}] "early appearance: '$::early_appear'"
        check waiting_after_countdown [expr {$::waiting_state == 1 && $::waiting_timer == 0}] "after the countdown the soldier is waiting: $::waiting_proof"
        if {$::appear_n >= 0 && $::cross_n >= 0} {
            set late [expr {$::appear_n - $::cross_n}]
            check appears_within_2_frames_of_leaving [expr {$late >= 0 && $late <= 2}] "player left the guard zone at sample $::cross_n, soldier at sample $::appear_n (+$late)"
        } else {
            check appears_within_2_frames_of_leaving 0 "cross_n=$::cross_n appear_n=$::appear_n"
        }
    }
    say [format "RESULT case=%s %s (checks failed: %d)" $::CASE [expr {$::checks_failed == 0 ? "PASS" : "FAIL"}] $::checks_failed]
    finish_now
}

after time 300 { say "RESULT case=$::CASE FAIL (wall timeout, round $::round, phase $::phase, n=$::n)"; finish_now }
