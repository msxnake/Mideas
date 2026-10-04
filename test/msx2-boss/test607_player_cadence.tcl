# Player movement cadence probe for the post-dialogue Boss fight.
set root "C:/Users/salam/Documents/Programacion/Mideas/work"
set f [open "$root/test607_deferred_player_cadence.txt" w]
set sf [open "$root/test607_deferred_render.sym" r]
set syms [read $sf]
close $sf
proc sym {label} {
    if {![regexp -line "^${label}: equ (\[0-9A-Fa-f\]+)H" $::syms -> hex]} { error "Missing symbol $label" }
    scan $hex %x addr
    return $addr
}
proc say {msg} { puts $::f $msg; flush $::f }
set A_move [sym update_player_movement]
set A_boss [sym bitmap_boss_update]
set A_launch [sym bitmap_boss_launch_cmd]
set A_restore [sym bitmap_boss_restore_strips]
set R_px [sym player_x]
set R_py [sym player_y]
set R_screen [sym current_screen_index]
set R_boss [sym boss_active]
set R_intro [sym boss_intro_state]
set R_auto [sym boss_intro_auto_move]
set R_dlg [sym bitmap_dlg_state]
set move_count 0
set move_prev_t -1
set move_prev_x -1
set move_intervals {}
set move_deltas {}
set frame_boss 0
set frame_launch 0
set frame_restore 0
set last_boss_t -1
set last_launch_t -1
set last_restore_t -1
proc boss_bp {} {
    global frame_boss last_boss_t
    incr frame_boss
    set last_boss_t [machine_info time]
    debug cont
}
proc launch_bp {} {
    global frame_launch last_launch_t
    incr frame_launch
    set last_launch_t [machine_info time]
    debug cont
}
proc restore_bp {} {
    global frame_restore last_restore_t
    incr frame_restore
    set last_restore_t [machine_info time]
    debug cont
}
proc move_bp {} {
    global move_count move_prev_t move_prev_x move_intervals move_deltas R_px R_py
    global frame_boss frame_launch frame_restore last_boss_t last_launch_t last_restore_t
    incr move_count
    set t [machine_info time]
    set x [debug read memory $R_px]
    if {$move_prev_t >= 35.0 && $move_prev_t < 40.0} {
        set dt [expr {($t - $move_prev_t) * 1000.0}]
        lappend move_intervals $dt
        lappend move_deltas [expr {$x - $move_prev_x}]
        if {$dt > 20.0} {
            say [format "MOVE_GAP dt=%.3f t=%.3f boss_calls=%d launches=%d restores=%d boss_t=%.3f launch_t=%.3f restore_t=%.3f" $dt $t $frame_boss $frame_launch $frame_restore $last_boss_t $last_launch_t $last_restore_t]
        }
    }
    set move_prev_t $t
    set move_prev_x $x
    set frame_boss 0
    set frame_launch 0
    set frame_restore 0
    if {$t >= 25.0 && ($move_count % 30) == 0} {
        say [format "MOVE count=%d t=%.3f player=%d,%d" $move_count $t $x [debug read memory $R_py]]
    }
    debug cont
}
proc state {tag} {
    say [format "STATE %s t=%.3f screen=%d boss=%d intro=%d auto=%d dlg=%d player=%d,%d" $tag [machine_info time] [debug read memory $::R_screen] [debug read memory $::R_boss] [debug read memory $::R_intro] [debug read memory $::R_auto] [debug read memory $::R_dlg] [debug read memory $::R_px] [debug read memory $::R_py]]
}
proc summary {values} {
    if {[llength $values] == 0} { say "RESULT n=0"; return }
    set n [llength $values]
    set sum 0.0
    set min [lindex $values 0]
    set max [lindex $values 0]
    set over16 0
    set over20 0
    foreach v $values {
        set sum [expr {$sum + $v}]
        if {$v < $min} { set min $v }
        if {$v > $max} { set max $v }
        if {$v > 16.8} { incr over16 }
        if {$v > 20.0} { incr over20 }
    }
    say [format "RESULT n=%d mean_ms=%.3f min_ms=%.3f max_ms=%.3f over16.8=%d over20=%d" $n [expr {$sum / $n}] $min $max $over16 $over20]
}

after time 6.0 {
    if {[catch {
        debug set_bp $::A_move {} { move_bp }
        debug set_bp $::A_boss {} { boss_bp }
        debug set_bp $::A_launch {} { launch_bp }
        debug set_bp $::A_restore {} { restore_bp }
    } err]} {
        say [format "SET_BP_ERROR %s" $err]
    }
    debug cont
}

# Enter game and reach the Boss room.
after time 6  { keymatrixdown 8 0x01 }
after time 6.5 { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 8.5 { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 10.5 { keymatrixup 8 0x01 }
after time 12 { keymatrixdown 8 0x80 }
after time 29 { keymatrixup 8 0x80 }
foreach t {13 15 17 19 21 23 25 27} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t+0.4}] "keymatrixup 8 0x01"
}
# The project configures UP as the dialogue talk/advance key. Advance every
# remaining line before measuring player movement; SPACE alone must not unlock
# the Boss Room Lock.
foreach t {24 25 26 27 28 29 30 31 32 33 34} {
    after time $t "keymatrixdown 8 0x20"
    after time [expr {$t+0.25}] "keymatrixup 8 0x20"
}
# Exercise player movement after the Boss dialogue/room lock is over.
after time 35 { keymatrixdown 8 0x80 }
after time 40 { keymatrixup 8 0x80 }
after time 28 { state t28 }
after time 30 { state t30 }
after time 35 { state t35 }
after time 41 {
    summary $::move_intervals
    say [format "MOVES total=%d final_player=%d,%d" $::move_count [debug read memory $::R_px] [debug read memory $::R_py]]
    close $::f
    exit
}
say "test607_player_cadence"
