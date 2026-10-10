# Pursuer soldier: what does it cost, and does the game still hold 60 fps with the soldier on screen?
#
# Boots a ROM of pursuer_alert_lab.json that STARTS IN ROOM C (make_pursuer_alert_lab.mjs --start-room C), waits for the soldier to
# appear (it walks away from the door by itself afterwards) and then watches 800 frames with it visible.
#
#   tick cost   time between the entry of the resident trampoline bitmap_pursuer_tick and the instruction after the `call` in the main
#               loop (the local label MIDEAS_TICK_DONE_LABEL, which the runner adds to a COPY of the ASM; the runner checks with cmp that
#               the ROM of that copy is byte-identical, so the label cost nothing). Emulated time (machine_info time), no wall clock.
#               Reported separately for the three kinds of frame the tick has: dormant (state 0: ret z), counting (state 1: bank
#               mapped, tick, banks restored) and the appearance frame (the one that writes the body).
#   soldier     time between the entry of bitmap_update_enemies and the instruction after its `call` in the main loop (the second local
#               label MIDEAS_UPDATE_DONE_LABEL, same trick, same cmp proof). The soldier is the only enemy of room C, so this is the cost of
#               the whole enemy pass for it: the interpreter step with the complete-body probes (the soldier's descriptor 03 03 08 1C), the clip-aware animation and the
#               follower's copy. Judged against 3.5 ms for the worst frame of the measured window (Director D9, 2026-10-10: with the
#               complete-body engine of 0eeb1e2a a thinking pass costs 2.95 ms here at HEAD and 3.00 ms with the 9x29 descriptor;
#               the slow-step sabotage adds ~1.2 ms and must go red).
#   lost frames measured where the loop is locked to the video: two consecutive RETURNS of the vblank wait are k frames apart and
#               k >= 2 (> 25 ms) is a lost frame. The loop ENTRY period is printed for information only: it moves by the difference
#               of work between consecutive frames (a body that thinks every other frame reads 20-22 ms with no frame lost).
#               Measured over MIDEAS_FRAMES (default 800) consecutive passes after the soldier is out.
#   slack       time the CPU spends spinning in bitmap_wait_vblank (the rest of the frame): min / median.
#
# Environment: MIDEAS_SYM MIDEAS_OUT MIDEAS_FRAMES MIDEAS_TICK_DONE_LABEL (default .pursuer_tick_done)
#              MIDEAS_UPDATE_DONE_LABEL (default .enemy_update_done)   MIDEAS_SOLDIER_LIMIT_MS (default 3.5)

proc env_or {name default} {
    if {[info exists ::env($name)] && $::env($name) ne ""} { return $::env($name) }
    return $default
}
set SYM    [env_or MIDEAS_SYM ""]
set OUT    [env_or MIDEAS_OUT "pursuer_cpu_probe_result.txt"]
set FRAMES [env_or MIDEAS_FRAMES 800]
set DONE_LABEL [env_or MIDEAS_TICK_DONE_LABEL .pursuer_tick_done]
set UPD_LABEL  [env_or MIDEAS_UPDATE_DONE_LABEL .enemy_update_done]
set SOLDIER_LIMIT [env_or MIDEAS_SOLDIER_LIMIT_MS 3.5]
set LOG [open $OUT w]
set throttle off   ;# all timing is emulated time (machine_info time) or frame counts: nothing depends on wall-clock speed
proc say {s} { puts $::LOG $s; flush $::LOG }
proc bail {msg} { say "RESULT FAIL ($msg)"; close $::LOG; exit }

array set SYMS {}
if {$SYM eq "" || [catch {set fh [open $SYM r]}]} { bail "instrument: cannot open sym '$SYM'" }
while {[gets $fh line] >= 0} { if {[regexp {^(\S+): equ ([0-9A-Fa-f]+)H\s*$} $line -> name hex]} { scan $hex %x v; set SYMS($name) $v } }
close $fh
proc sym {name} { if {![info exists ::SYMS($name)]} { bail "instrument: missing symbol $name" }; return $::SYMS($name) }
set A_LOOP   [sym .bitmap_main_loop]
set A_RET    [expr {$A_LOOP + 3}]
set A_WAIT   [sym bitmap_wait_vblank]
set A_TICK   [sym bitmap_pursuer_tick]
set A_DONE   [sym $DONE_LABEL]
set A_UPD    [sym bitmap_update_enemies]
set A_UPDONE [sym $UPD_LABEL]
set A_STATE  [sym bitmap_pursuer_state]
set A_POOL   [sym bitmap_enemy_pool]
set A_PX     [sym player_x]
set A_PY     [sym player_y]
set A_HEALTH [sym player_health]
set A_LIVES  [sym player_lives]
set A_SCREEN [sym current_screen_index]
set A_COUNT  [sym bitmap_enemy_count]
set STRIDE   [sym BITMAP_PURSUER_POOL_STRIDE]
set A_INVULN [sym player_invuln]
proc rb {a} { return [debug read memory $a] }
proc key {row mask down} { if {$down} { keymatrixdown $row $mask } else { keymatrixup $row $mask } }
proc tapspace {} { keymatrixdown 8 0x01; after time 0.15 { keymatrixup 8 0x01 } }

# instrument: the labels really sit right after `call bitmap_pursuer_tick` / `call bitmap_update_enemies`
set tick_call [expr {$A_DONE - 3}]
set upd_call [expr {$A_UPDONE - 3}]
proc rbi {a} { return [debug read memory $a] }
# The ROM is only mapped once the game loop runs, so the two label checks happen at the FIRST pass of the main loop (see the A_LOOP breakpoint).
proc check_labels {} {
    if {[rbi $::upd_call] != 0xCD || ([rbi [expr {$::upd_call + 1}]] + 256 * [rbi [expr {$::upd_call + 2}]]) != $::A_UPD} {
        bail [format "instrument: %04X is not a call bitmap_update_enemies (bytes %02X -> %04X, expected %04X)" $::upd_call [rbi $::upd_call] [expr {[rbi [expr {$::upd_call + 1}]] + 256 * [rbi [expr {$::upd_call + 2}]]}] $::A_UPD]
    }
    if {[rbi $::tick_call] != 0xCD || ([rbi [expr {$::tick_call + 1}]] + 256 * [rbi [expr {$::tick_call + 2}]]) != $::A_TICK} {
        bail [format "instrument: %04X is not a call bitmap_pursuer_tick" $::tick_call]
    }
    say "instrument OK: both timing labels sit right after their calls"
}
set labels_checked 0
say [format "loop=%04X tick=%04X done=%04X (call at %04X)  frames=%d" $A_LOOP $A_TICK $A_DONE $tick_call $FRAMES]

set started 0
set iters 0
set phase 0                ;# 0 boot, 1 walk away until the soldier is out, 2 settle, 3 measure, 4 done
set phase_iter 0
set t_loop_prev -1
set t_in 0
set t_ret_in 0
set state_in 0
set periods {}
set slacks {}
set cur_entry 0
set lost 0
set lost_log {}
set t_ret_prev -1
set vperiods {}
set vlost 0
set vlost_log {}
set keyR 0
set measured 0

proc setr {r} { if {$r != $::keyR} { key 8 0x80 $r; set ::keyR $r } }

set boot_n 0
proc boot_tick {} {
    if {$::started} { return }
    incr ::boot_n
    tapspace
    if {$::boot_n > 100} { bail "game loop never reached" }
    after time 1.2 boot_tick
}
after time 1.0 boot_tick

proc modeof {i} { return [rb [expr {$::A_POOL + $i * $::STRIDE + 13}]] }

# --- tick timing ---
debug set_bp $A_TICK {} {
    set ::t_in [machine_info time]
    set ::state_in [rb $::A_STATE]
}
debug set_bp $A_DONE {} {
    if {$::started} {
        set dt [expr {([machine_info time] - $::t_in) * 1000.0}]
        # appearance frame: the tick went in with state 1 and came out with state 0
        if {$::state_in == 0} { lappend ::kinds_dormant $dt } elseif {[rb $::A_STATE] == 0} { lappend ::kinds_appear $dt } else { lappend ::kinds_counting $dt }
    }
}
set kinds_dormant {}
set kinds_counting {}
set kinds_appear {}

# --- the soldier's whole enemy pass: bitmap_update_enemies, entry to the instruction after its call ---
set t_upd_in 0
set kinds_update {}
debug set_bp $A_UPD {} {
    # only the call of the main loop (the loaders do not call it, but the instrument is cheap)
    set ::t_upd_in [machine_info time]
}
debug set_bp $A_UPDONE {} {
    if {$::started && $::phase == 3} { lappend ::kinds_update [expr {([machine_info time] - $::t_upd_in) * 1000.0}] }
}

# --- loop period / slack ---
debug set_bp $A_LOOP {} {
    if {!$::labels_checked} { set ::labels_checked 1; check_labels }
    set ::started 1
    incr ::iters
    set t [machine_info time]
    set ::cur_entry $t
    if {$::phase == 3 && $::t_loop_prev >= 0} {
        set p [expr {($t - $::t_loop_prev) * 1000.0}]
        lappend ::periods $p
        if {$p > 20.8} {
            incr ::lost
            # what was going on: a lost frame next to a player-hurt event is the damage path (hearts HUD redraw, i-frames), not the soldier's tick
            if {$::lost <= 3} { lappend ::lost_log [format "iter=%d period=%.2f ms (health=%d invuln=%d soldier=(%d,%d) player=(%d,%d))" $::iters $p [rb $::A_HEALTH] [rb $::A_INVULN] [rb $::A_POOL] [rb [expr {$::A_POOL + 1}]] [rb $::A_PX] [rb $::A_PY]] }
        }
    }
    set ::t_loop_prev $t
    # The soldier patrols the corridor the player stands in. A touch costs a heart: the hurt path (hearts HUD redraw through the VDP
    # command engine, i-frames) loses frames by itself and has nothing to do with the soldier's tick. Keep the touch pass out of the
    # measurement by holding the player invulnerable (the touch check returns at once), so what is timed is the soldier on screen.
    debug write memory $::A_INVULN 255
    if {$::iters % 20 == 0} { debug write memory $::A_HEALTH 5; debug write memory $::A_LIVES 9 }
    step_scenario
}
debug set_bp $A_RET {} {
    set t [machine_info time]
    if {$::phase == 3} {
        lappend ::slacks [expr {($t - $::cur_entry) * 1000.0}]
        if {$::t_ret_prev >= 0} {
            set p [expr {($t - $::t_ret_prev) * 1000.0}]
            lappend ::vperiods $p
            if {$p > 25.0} { incr ::vlost; if {$::vlost <= 3} { lappend ::vlost_log [format "iter=%d vblank period=%.2f ms" $::iters $p] } }
        }
        set ::t_ret_prev $t
    }
}

proc step_scenario {} {
    switch $::phase {
        0 { if {$::iters >= 5} { set ::phase 1; set ::phase_iter $::iters; setr 1 } }
        1 { # walk right to get 32+ px away from the door; the soldier appears when the countdown is over
            if {$::iters - $::phase_iter >= 24} { setr 0 }
            if {[modeof 0] == 14 && [modeof 1] == 15} { setr 0; set ::phase 2; set ::phase_iter $::iters; say "soldier out at iter $::iters" } }
        2 { if {$::iters - $::phase_iter >= 30} { set ::phase 3; set ::phase_iter $::iters; set ::t_loop_prev -1 } }
        3 { if {$::iters - $::phase_iter >= $::FRAMES + 1} { finish } }
    }
    if {$::iters > 4000} { bail "soldier never appeared (phase $::phase)" }
}

proc stats {name list} {
    set n [llength $list]
    if {$n == 0} { say [format "%-9s n=0" $name]; return }
    set s [lsort -real $list]
    set sum 0.0
    foreach v $s { set sum [expr {$sum + $v}] }
    say [format "%-9s n=%d min=%.4f median=%.4f mean=%.4f max=%.4f ms" $name $n [lindex $s 0] [lindex $s [expr {$n / 2}]] [expr {$sum / $n}] [lindex $s end]]
}

proc finish {} {
    set ::phase 4
    stats tick_dormant  $::kinds_dormant
    stats tick_counting $::kinds_counting
    stats tick_appear   $::kinds_appear
    stats soldier_update $::kinds_update
    stats period        $::periods
    stats slack         $::slacks
    say [format "soldier visible: slot0 mode=%d slot1 mode=%d enemy_count=%d room=%d player=(%d,%d)" [modeof 0] [modeof 1] [rb $::A_COUNT] [rb $::A_SCREEN] [rb $::A_PX] [rb $::A_PY]]
    set worst 0.0
    foreach l [list $::kinds_counting $::kinds_appear] { foreach v $l { if {$v > $worst} { set worst $v } } }
    say [format "worst tick (counting or appearance frame) = %.4f ms (limit 0.2)" $worst]
    set worst_upd 0.0
    foreach v $::kinds_update { if {$v > $worst_upd} { set worst_upd $v } }
    say [format "worst soldier pass (bitmap_update_enemies, soldier only) = %.4f ms (limit %s)" $worst_upd $::SOLDIER_LIMIT]
    say "loop-entry periods > 20.8 ms (information only, not a lost-frame proof): $::lost (first: $::lost_log)"
    stats vperiod       $::vperiods
    say "lost frames (vblank-aligned period > 25 ms) in [llength $::vperiods] frames: $::vlost (first: $::vlost_log)"
    set ok [expr {$worst <= 0.2 && $worst_upd <= $::SOLDIER_LIMIT && [llength $::kinds_update] >= $::FRAMES && $::vlost == 0 && [llength $::vperiods] >= $::FRAMES - 1 && [llength $::kinds_counting] > 0 && [llength $::kinds_appear] > 0 && [modeof 0] == 14}]
    say "RESULT [expr {$ok ? {PASS} : {FAIL}}]"
    close $::LOG
    exit
}
after time 600 { bail "wall timeout" }
