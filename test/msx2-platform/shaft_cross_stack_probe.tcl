# OpenMSX probe: a lift (platform_shaft) carries the player across a room boundary and the game loop must SURVIVE it.
#
# Built for the unbalanced-stack defect of bitmap_shaft_ride_detect: while the hand-over is in flight the cabin rider byte is 2 and
# ride_detect skipped to a label BEFORE its `pop bc` although it had not pushed anything, so it popped the caller's return address
# and the main loop returned to the GameFlow node that called it (End / Restart). The ROM comes from make_shaft_cross_lab.mjs.
#
# env: MIDEAS_SYM (Glass .sym), MIDEAS_OUT (result file), MIDEAS_DIR up|down, MIDEAS_MAX_SAMPLES (default 700), MIDEAS_WALL (s, 90)
#
# What is MEASURED (every line is flushed, a probe that dies half-way leaves evidence):
#   1. instrument checks - the byte before bitmap_shaft_sat (= the last instruction of ride_detect) is C9 (ret); the cabin is boarded
#      through the REAL seam (the probe only places the player on the cabin top, bitmap_shaft_ride_detect itself sets rider=1); at
#      least one ride_detect call ran with the rider byte at 2 (otherwise the path under test was never exercised).
#   2. stack balance of ride_detect: SP and the return address at its `ret` equal those at its entry, on EVERY call.
#   3. the main loop never returns: SP sampled at .bitmap_main_loop is constant and bitmap_end_wait_key (the End node) is never hit.
#   4. the crossing happens: current_screen_index goes to the room the shaft path names for the destination slot.
#   5. the ride goes on in the new room: 90 samples after the arrival rider=1, hand-over=0, composition=0, player_y = cabin_y - 32
#      and the cabin has moved.
proc env_or {name default} { if {[info exists ::env($name)] && $::env($name) ne ""} { return $::env($name) }; return $default }
set SYM  [env_or MIDEAS_SYM ""]
set OUT  [env_or MIDEAS_OUT "shaft_cross_stack_result.txt"]
set DIR  [env_or MIDEAS_DIR "up"]
set MAXS [env_or MIDEAS_MAX_SAMPLES 700]
set WALL [env_or MIDEAS_WALL 90]
set LOG [open $OUT w]
set throttle off
proc say {s} { puts $::LOG $s; flush $::LOG }
proc finish_now {} { close $::LOG; exit }
array set SYMS {}
if {[catch {set fh [open $SYM r]}]} { say "RESULT FAIL (no sym file '$SYM')"; finish_now }
while {[gets $fh line] >= 0} { if {[regexp {^(\S+): equ ([0-9A-Fa-f]+)H\s*$} $line -> name hex]} { scan $hex %x v; set SYMS($name) $v } }
close $fh
proc sym {name} { if {![info exists ::SYMS($name)]} { say "RESULT FAIL (missing symbol $name)"; finish_now }; return $::SYMS($name) }
proc rb {a} { return [debug read memory $a] }
proc rw {a} { return [expr {[rb $a] | ([rb [expr {$a + 1}]] << 8)}] }

set A_LOOP   [sym .bitmap_main_loop]
set A_SHAFT  [sym bitmap_shaft_state]
set A_HAND   [sym bitmap_shaft_handover]
set A_SCR    [sym current_screen_index]
set A_PX     [sym player_x]
set A_PY     [sym player_y]
set A_COMP   [sym bitmap_composition_state]
set A_DETECT [sym bitmap_shaft_ride_detect]
set A_DRET   [expr {[sym bitmap_shaft_sat] - 1}]
set A_END    [sym bitmap_end_wait_key]
set A_PEND   [sym bitmap_pending_room]
set A_BLK    [sym bitmap_composition_blocks_left]
set A_FORCED [sym bitmap_shaft_forced_room]
set A_PATH   [sym bitmap_shaft_path_0]
set A_DEF    [sym bitmap_shaft_def_0]
set STAND    32

set n 0
set started 0
set done 0
set fails 0
set sp0 -1
set sp_dev 0
set arrival -1
set arrival_cy -1
set det_calls 0
set det_rider2 0
set det_unbalanced 0
set det_rets 0
set det_sp_in 0
set det_ret_in 0
set src_scr -1
set dest_scr -1
set last_screen -1
set screens_seen {}
proc check {name ok detail} { if {!$ok} { incr ::fails }; say [format "CHECK %-32s %s  %s" $name [expr {$ok ? "PASS" : "FAIL"}] $detail] }
proc cabin {} { return [format "slot=%d y=%d dir=%d rider=%d" [rb $::A_SHAFT] [rb [expr {$::A_SHAFT+1}]] [rb [expr {$::A_SHAFT+2}]] [rb [expr {$::A_SHAFT+3}]]] }

# --- ride_detect balance: SP and return address at the ret must equal those at the entry ----------------------------------------
debug set_bp $A_DETECT {} {
    incr ::det_calls
    set ::det_sp_in [reg SP]
    set ::det_ret_in [rw [reg SP]]
    if {[rb [expr {$::A_SHAFT + 3}]] == 2} { incr ::det_rider2 }
}
debug set_bp $A_DRET {} {
    incr ::det_rets
    if {[reg SP] != $::det_sp_in || [rw [reg SP]] != $::det_ret_in} {
        incr ::det_unbalanced
        say [format "UNBALANCED ride_detect n=%d: SP entry=%04X ret=%04X  SP at ret=%04X top=%04X  (rider2 calls so far %d)" $::n $::det_sp_in $::det_ret_in [reg SP] [rw [reg SP]] $::det_rider2]
    }
}
# --- the End node: only reachable if the main loop returned --------------------------------------------------------------------
# Same fields, same order as test/msx2-platform/ride_log.txt (a 2026-08 probe log), so the two can be compared line by line.
proc ride_log_line {} {
    return [format "room=%d slot=%d cy=%d rider=%d hand=%d py=%d comp=%d pend=%d dir=%d blk=%d forced=%d" [rb $::A_SCR] [rb $::A_SHAFT] [rb [expr {$::A_SHAFT+1}]] [rb [expr {$::A_SHAFT+3}]] [rb $::A_HAND] [rb $::A_PY] [rb $::A_COMP] [rb $::A_PEND] [rb [expr {$::A_PEND+1}]] [rb $::A_BLK] [rb $::A_FORCED]]
}
debug set_bp $A_END {} {
    if {$::done} { return }
    set ::done 1
    say [format "RETURNED_TO_END n=%d SP=%04X (loop SP was %04X)" $::n [reg SP] $::sp0]
    say "ENDSTATE      [ride_log_line]"
    check loop_never_returned 0 "bitmap_enter_game_loop returned to the End node"
    check ride_detect_balanced [expr {$::det_unbalanced == 0}] "$::det_unbalanced unbalanced of $::det_calls calls ($::det_rider2 with rider=2)"
    # the End node only waits for SPACE: nothing advances the composition any more, so a second sample must be IDENTICAL
    after time 0.8 { say "ENDSTATE+0.8s [ride_log_line]"; say [format "RESULT FAIL (fails %d) dir=%s" $::fails $::DIR]; finish_now }
}

proc conclude {} {
    set ::done 1
    check loop_sp_constant [expr {$::sp_dev == 0}] "SP at the main loop: first $::sp0, deviating samples $::sp_dev"
    check ride_detect_balanced [expr {$::det_unbalanced == 0}] "$::det_unbalanced unbalanced of $::det_calls calls"
    # calibration: the ret breakpoint must see every call, or a misplaced A_DRET would make the balance check vacuous
    check ret_bp_sees_every_call [expr {$::det_rets == $::det_calls && $::det_calls > 0}] "$::det_rets ret hits for $::det_calls calls"
    check path_rider2_exercised [expr {$::det_rider2 > 0}] "$::det_rider2 ride_detect calls entered with rider=2"
    check crossed_to_dest_room [expr {$::arrival >= 0}] "screen $::src_scr -> $::dest_scr (arrival at sample $::arrival), screens seen: $::screens_seen"
    if {$::arrival >= 0} {
        set cy [rb [expr {$::A_SHAFT + 1}]]; set py [rb $::A_PY]
        check rider_back_on_cabin [expr {[rb [expr {$::A_SHAFT + 3}]] == 1}] "[cabin]"
        check handover_cleared [expr {[rb $::A_HAND] == 0}] "bitmap_shaft_handover=[rb $::A_HAND]"
        check composition_idle [expr {[rb $::A_COMP] == 0}] "bitmap_composition_state=[rb $::A_COMP]"
        check player_on_cabin [expr {$py == (($cy - $::STAND) & 255)}] "player_y=$py cabin_y=$cy"
        check still_in_dest_room [expr {[rb $::A_SCR] == $::dest_scr}] "screen=[rb $::A_SCR]"
        check cabin_kept_moving [expr {$cy != $::arrival_cy}] "cabin_y at arrival $::arrival_cy, now $cy"
    }
    say [format "RESULT %s (fails %d) dir=%s samples=%d" [expr {$::fails == 0 ? "PASS" : "FAIL"}] $::fails $::DIR $::n]
    finish_now
}

debug set_bp $A_LOOP {} {
    if {$::done} { return }
    set ::started 1
    incr ::n
    if {$::n == 1} {
        set ::sp0 [reg SP]
        set ::src_scr [rb $::A_SCR]
        set ::last_screen $::src_scr
        set ::screens_seen [list $::src_scr]
        # calibrate the instrument before trusting any number it produces
        check ret_at_detect_end [expr {[rb $::A_DRET] == 0xC9}] [format "byte at %04X = %02X (C9 = ret)" $::A_DRET [rb $::A_DRET]]
        set cnt [rb $::A_PATH]
        set slot [rb $::A_SHAFT]; set dir [rb [expr {$::A_SHAFT + 2}]]
        set dslot [expr {$dir == 0 ? $slot + 1 : $slot - 1}]
        check path_has_dest_slot [expr {$cnt == 2 && $dslot >= 0 && $dslot < $cnt}] "path of $cnt rooms, cabin slot $slot dir $dir -> destination slot $dslot"
        set ::dest_scr [rb [expr {$::A_PATH + 1 + $dslot}]]
        check start_screen_is_cabin_room [expr {$::src_scr == [rb [expr {$::A_PATH + 1 + $slot}]]}] "screen $::src_scr, path room of the start slot [rb [expr {$::A_PATH + 1 + $slot}]]"
        check dest_differs_from_start [expr {$::dest_scr != $::src_scr}] "dest $::dest_scr"
        check cabin_dir_matches_lab [expr {$dir == ($::DIR eq "up" ? 0 : 1)}] "dir byte $dir, lab $::DIR"
        say [format "START n=1 SP=%04X screen=%d player=(%d,%d) cabin %s" $::sp0 $::src_scr [rb $::A_PX] [rb $::A_PY] [cabin]]
    }
    # board: only PLACE the player on the cabin top for the first 4 samples; bitmap_shaft_ride_detect decides the rider
    if {$::n <= 4} {
        debug write memory $::A_PX 32
        debug write memory $::A_PY [expr {([rb [expr {$::A_SHAFT + 1}]] - $::STAND) & 255}]
    }
    if {$::n == 10} {
        check boarded_through_ride_detect [expr {[rb [expr {$::A_SHAFT + 3}]] == 1}] "[cabin] player=([rb $::A_PX],[rb $::A_PY])"
    }
    if {[reg SP] != $::sp0} {
        incr ::sp_dev
        if {$::sp_dev <= 3} { say [format "SP_DEVIATION n=%d SP=%04X (first %04X) screen=%d cabin %s" $::n [reg SP] $::sp0 [rb $::A_SCR] [cabin]] }
    }
    set scr [rb $::A_SCR]
    if {$scr != $::last_screen} { lappend ::screens_seen $scr; set ::last_screen $scr }
    if {$::arrival < 0 && $scr == $::dest_scr && $scr != $::src_scr} {
        set ::arrival $::n
        set ::arrival_cy [rb [expr {$::A_SHAFT + 1}]]
        say [format "ARRIVAL n=%d screen=%d player=(%d,%d) cabin %s hand=%d comp=%d" $::n $scr [rb $::A_PX] [rb $::A_PY] [cabin] [rb $::A_HAND] [rb $::A_COMP]]
    }
    if {$::n % 20 == 0} { say [format "n=%d scr=%d py=%d cabin %s hand=%d comp=%d SP=%04X" $::n $scr [rb $::A_PY] [cabin] [rb $::A_HAND] [rb $::A_COMP] [reg SP]] }
    if {$::arrival >= 0 && $::n >= $::arrival + 90} { conclude }
    if {$::n >= $::MAXS} {
        check crossed_to_dest_room [expr {$::arrival >= 0}] "no arrival within $::MAXS samples (screens seen $::screens_seen)"
        say [format "RESULT FAIL (fails %d) dir=%s samples=%d" $::fails $::DIR $::n]
        finish_now
    }
}

# the title / Start node waits for SPACE: tap it until the game loop is running
proc tapspace {} { keymatrixdown 8 0x01; after time 0.15 { keymatrixup 8 0x01 } }
set boot_n 0
proc boot_tick {} { if {$::started} { return }; incr ::boot_n; tapspace; if {$::boot_n > 60} { say "RESULT FAIL (the game loop never started)"; finish_now }; after time 1.2 boot_tick }
after time 1.0 boot_tick
after time $WALL { say [format "RESULT FAIL (wall timeout after %d s) n=%d PC=%04X SP=%04X screen=%d cabin %s" $::WALL $::n [reg PC] [reg SP] [rb $::A_SCR] [cabin]]; finish_now }
