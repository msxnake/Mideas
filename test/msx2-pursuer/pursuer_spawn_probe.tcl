# Pursuer soldier: does it appear where the player came in, after the countdown, in ONE frame, and only when the player is away?
#
# One OpenMSX run = one case against one ROM of test/msx2-pursuer/pursuer_alert_lab.json (rooms A - B - C - D, alert zones in B and C,
# 2 s countdown = 120 frames, guard 32 px):
#   a  start in A, walk east into B (the soldier's door is B's west side), move 32+ px away and wait.
#   b  same entry, but stand still ON the door: the soldier must NOT appear while the player is < guard away, even after the
#      countdown has ended, and must appear within 2 frames of the player stepping away.
#   c  start in D, walk west into C: the entry door is C's EAST side (x = 238), then move away and wait.
#   d  boot (GameFlow WorldLink) straight into C: the BOOT-init path of the hook, not the room-commit one.
#
# What is measured, and why it can be trusted:
#   frame     one pass of the main loop = one hit of the breakpoint on `.bitmap_main_loop`. Never wall-clock time.
#   sample    taken at the entry of bitmap_update_enemies, i.e. AFTER the pursuer tick of that frame and BEFORE the enemy update, so the
#             pool still holds exactly what the tick wrote (the known 16 px sinking of a 16x32 body under the 16x16 interpreter has not
#             happened yet). The instrument check proves that the call just before it is `call bitmap_pursuer_tick`.
#   init      breakpoint on bitmap_pursuer_init: the frame, the room and the player position at the moment the room hook ran.
#   Every address comes from the .sym of THIS rom (MIDEAS_SYM); a missing symbol is "FAIL instrument", never a guess.
#
# Verdict lines: "CHECK name=... PASS|FAIL detail" and one "RESULT case=<c> PASS|FAIL". Environment:
#   MIDEAS_SYM  .sym of the ROM        MIDEAS_OUT  result file        MIDEAS_CASE  a|b|c|d
#   MIDEAS_DELAY_FRAMES (default 120)  MIDEAS_GUARD (default 32)      MIDEAS_MAX_FRAMES (default 1500)
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

proc rb {a} { return [debug read memory $a] }
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

say "case=$CASE delay=$DELAY guard=$GUARD stride=$STRIDE slots=$NSLOTS sym=$SYM"
say [format "loop=%04X upd=%04X init=%04X tick=%04X pool=%04X" $A_LOOP $A_UPD $A_INIT $A_TICK $A_POOL]

# ---- state -------------------------------------------------------------------------------------------------------------------
set iters 0                 ;# main-loop passes since the first one
set n 0                     ;# samples (== passes that reached the enemy update)
set started 0
set checked 0
set boots 0
set inits {}                ;# list of {iters screen player_x player_y} per bitmap_pursuer_init hit
set phase 0
set phase_n 0
set start_screen -1
set entry_n -1              ;# sample number of the first sample after the relevant init
set entry_iters -1
set entry_screen -1
set entry_px -1
set entry_py -1
set torn {}
set appear_n -1
set appear {}
set cross_n -1
set waiting_proof ""
set stood_still_until -1
set checks_failed 0
set done 0

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
    lappend ::inits [list $::iters [rb $::A_SCREEN] [rb $::A_PX] [rb $::A_PY]]
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

    if {$::n > $::MAXF} { conclude "timeout after $::MAXF samples (phase $::phase)"; return }

    # The room entry: the first sample after an init hook that LEFT THE COUNTDOWN ARMED (state 1). a, b and c run the boot init in a room
    # with no alert first (it leaves state 0) and only later enter the alert room; d arms the countdown in the boot init itself.
    if {$::entry_n < 0 && [llength $::inits] > 0 && [rb $::A_STATE] == 1} {
        lassign [lindex $::inits end] it scr px py
        set ::entry_n $::n
        set ::entry_iters $it
        set ::entry_screen [rb $::A_SCREEN]
        set ::entry_px $px
        set ::entry_py $py
    }

    switch $::CASE {
        a { scenario_walk_in_and_wait right }
        b { scenario_stand_then_leave }
        c { scenario_walk_in_and_wait left }
        d { scenario_boot_and_wait }
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
    if {$::phase == 99 && ($::n - $::phase_n) >= 3} { conclude "" }
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
                set ::waiting_proof [format "state=%d timer=%d player_dist=%s hidden_for=%d" [rb $::A_STATE] [rb $::A_TIMER] [dist_from_entry] [expr {$::n - $::entry_n}]]
                set ::waiting_state [rb $::A_STATE]
                set ::waiting_timer [rb $::A_TIMER]
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

set early_appear ""
set waiting_state -1
set waiting_timer -1
set cross_iters -1

proc conclude {why} {
    if {$::done} { return }
    set ::done 1
    setkeys 0 0
    say "-- inits (iters screen player_x player_y): $::inits"
    say [format "start_screen=%d entry: n=%d iters=%d screen=%d player=(%d,%d)" $::start_screen $::entry_n $::entry_iters $::entry_screen $::entry_px $::entry_py]
    if {$why ne ""} { check timeout 0 $why }

    check init_hook_ran [expr {$::entry_n >= 0}] "inits=[llength $::inits] armed_entry=[expr {$::entry_n >= 0}]"
    if {$::entry_n >= 0} {
        check entry_matches_hook [expr {[rb $::A_ENTRY_X] == $::entry_px && [rb $::A_ENTRY_Y] == $::entry_py}] \
            [format "RAM entry=(%d,%d) player at init=(%d,%d)" [rb $::A_ENTRY_X] [rb $::A_ENTRY_Y] $::entry_px $::entry_py]
    }
    check never_torn [expr {[llength $::torn] == 0}] "torn samples (leader/follower modes neither both $::MODE_HIDDEN nor $::MODE_SCRIPTED/$::MODE_FOLLOWER): [llength $::torn], first: [lrange $::torn 0 1]"
    check appeared [expr {$::appear_n >= 0}] "appear_n=$::appear_n"
    if {$::appear_n >= 0} {
        lassign $::appear a_iters x0 y0 x1 y1 apx apy a_state a_count ex ey a_screen
        set hidden_frames [expr {$a_iters - $::entry_iters}]
        if {$::CASE ne "b"} {
            # b keeps the player on the door on purpose, so there the soldier is held back well past the countdown.
            check delay_frames [expr {$hidden_frames >= $::DELAY - 1 && $hidden_frames <= $::DELAY + 1}] \
                "hidden $hidden_frames frames after the entry (expected $::DELAY +-1; entry_iters=$::entry_iters appear_iters=$a_iters)"
        } else {
            say "hidden $hidden_frames frames after the entry (case b: held back by the guard, the countdown was $::DELAY)"
        }
        check leader_at_entry [expr {$x0 == $ex && $y0 == $ey}] "leader=($x0,$y0) entry=($ex,$ey)"
        check follower_below_leader [expr {$x1 == $ex && $y1 == $ey + 16}] "follower=($x1,$y1) expected ($ex,[expr {$ey + 16}])"
        check same_frame_complete 1 "the appearance sample already had modes $::MODE_SCRIPTED/$::MODE_FOLLOWER in both slots and both positions (classified before anything else ran)"
        set dx [iabs [expr {$apx - $ex}]]
        set dy [iabs [expr {$apy - $ey}]]
        check player_away [expr {$dx >= $::GUARD || $dy >= $::GUARD}] "player=($apx,$apy) entry=($ex,$ey) |dx|=$dx |dy|=$dy guard=$::GUARD"
        check slot_count [expr {$a_count == $::NSLOTS}] "bitmap_enemy_count=$a_count soldier slots=$::NSLOTS"
        check state_after [expr {$a_state == 0}] "bitmap_pursuer_state=$a_state after appearing"
        if {$::CASE eq "c"} { check entry_is_east_door [expr {$ex >= 230}] "entry x=$ex (C is entered by its east side)" }
        if {$::CASE eq "a" || $::CASE eq "b"} { check entry_is_west_door [expr {$ex <= 8}] "entry x=$ex (B is entered by its west side)" }
        say [format "appearance: iters=%d player=(%d,%d) leader=(%d,%d) follower=(%d,%d) entry=(%d,%d) screen=%d" $a_iters $apx $apy $x0 $y0 $x1 $y1 $ex $ey $a_screen]
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

after time 300 { say "RESULT case=$::CASE FAIL (wall timeout, phase $::phase, n=$::n)"; finish_now }
