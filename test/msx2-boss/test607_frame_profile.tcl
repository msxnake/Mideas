# Frame-interval profile for test607. Breakpoint callbacks do not advance
# emulated time; only timestamps and counters are collected.
set root "C:/Users/salam/Documents/Programacion/Mideas/work"
set f [open "$root/test607_frame_profile.txt" w]
set sf [open "$root/test607_edge_sync.sym" r]
set syms [read $sf]
close $sf
proc sym {label} {
    if {![regexp -line "^${label}: equ (\[0-9A-Fa-f\]+)H" $::syms -> hex]} { error "Missing symbol $label" }
    scan $hex %x addr
    return $addr
}
proc say {msg} { puts $::f $msg; flush $::f }
set A_loop [sym bitmap_enter_game_loop]
set A_boss [sym bitmap_boss_update]
set A_launch [sym bitmap_boss_launch_cmd]
set A_restore [sym bitmap_boss_restore_strips]
set A_bcol [sym bitmap_boss_sbul_anim_colors]
set A_pcol [sym bitmap_upload_player_frame_colors]
set A_move [sym update_player_movement]
set t_prev -1
set frame_count 0
set interval_ms {}
set interval_boss {}
set interval_launch {}
set interval_restore {}
set interval_bcol {}
set interval_pcol {}
set interval_move {}
set cur_boss 0
set cur_launch 0
set cur_restore 0
set cur_bcol 0
set cur_pcol 0
set cur_move 0
set last_event_time -1
set last_event_tag "boot"
set event_spikes 0

proc mark_event {tag} {
    global last_event_time last_event_tag event_spikes
    set t [machine_info time]
    if {$last_event_time >= 28.0 && $last_event_time < 35.0} {
        set dt [expr {($t - $last_event_time) * 1000.0}]
        if {$dt > 10.0} {
            incr event_spikes
            say [format "EVENT_GAP from=%s to=%s dt=%.3f t=%.3f boss=%d intro=%d proj=%d" $last_event_tag $tag $dt $t [debug read memory [sym boss_active]] [debug read memory [sym boss_intro_state]] [debug read memory [sym boss_proj_active]]]
        }
    }
    set last_event_time $t
    set last_event_tag $tag
}

proc loop_bp {} {
    global t_prev frame_count interval_ms interval_boss interval_launch
    global interval_restore interval_bcol interval_pcol interval_move
    global cur_boss cur_launch cur_restore cur_bcol cur_pcol cur_move
    incr frame_count
    set t [machine_info time]
    if {$t_prev >= 15.0 && $t_prev < 35.0} {
        lappend interval_ms [expr {($t - $t_prev) * 1000.0}]
        lappend interval_boss $cur_boss
        lappend interval_launch $cur_launch
        lappend interval_restore $cur_restore
        lappend interval_bcol $cur_bcol
        lappend interval_pcol $cur_pcol
        lappend interval_move $cur_move
    }
    set t_prev $t
    set cur_boss 0
    set cur_launch 0
    set cur_restore 0
    set cur_bcol 0
    set cur_pcol 0
    set cur_move 0
    debug cont
}
proc boss_bp {} { incr ::cur_boss; mark_event bitmap_boss_update; debug cont }
proc launch_bp {} { incr ::cur_launch; mark_event bitmap_boss_launch_cmd; debug cont }
proc restore_bp {} { incr ::cur_restore; mark_event bitmap_boss_restore_strips; debug cont }
proc bcol_bp {} { incr ::cur_bcol; mark_event bitmap_boss_sbul_anim_colors; debug cont }
proc pcol_bp {} { incr ::cur_pcol; mark_event bitmap_upload_player_frame_colors; debug cont }
proc move_bp {} { incr ::cur_move; mark_event update_player_movement; debug cont }
proc summary {label values} {
    if {[llength $values] == 0} { say "$label n=0"; return }
    set n [llength $values]
    set sum 0.0
    set min [lindex $values 0]
    set max [lindex $values 0]
    set over16 0
    set over20 0
    set over33 0
    foreach v $values {
        set sum [expr {$sum + $v}]
        if {$v < $min} { set min $v }
        if {$v > $max} { set max $v }
        if {$v > 16.8} { incr over16 }
        if {$v > 20.0} { incr over20 }
        if {$v > 33.0} { incr over33 }
    }
    say [format "%s n=%d mean=%.3f min=%.3f max=%.3f over16.8=%d over20=%d over33=%d" $label $n [expr {$sum / $n}] $min $max $over16 $over20 $over33]
}
proc conditional_summary {label values flags} {
    set selected {}
    for {set i 0} {$i < [llength $values]} {incr i} {
        if {[lindex $flags $i] > 0} { lappend selected [lindex $values $i] }
    }
    summary $label $selected
}

after time 6.0 {
    debug set_bp $::A_loop {} { loop_bp }
    debug set_bp $::A_boss {} { boss_bp }
    debug set_bp $::A_launch {} { launch_bp }
    debug set_bp $::A_restore {} { restore_bp }
    debug set_bp $::A_bcol {} { bcol_bp }
    debug set_bp $::A_pcol {} { pcol_bp }
    debug set_bp $::A_move {} { move_bp }
    debug cont
}

# Reach the Boss room and exercise the same movement path.
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
after time 36 {
    summary "ALL" $::interval_ms
    conditional_summary "BOSS_UPDATE" $::interval_ms $::interval_boss
    conditional_summary "BOSS_LAUNCH" $::interval_ms $::interval_launch
    conditional_summary "BOSS_RESTORE" $::interval_ms $::interval_restore
    conditional_summary "BOSS_COLOR" $::interval_ms $::interval_bcol
    conditional_summary "PLAYER_COLOR" $::interval_ms $::interval_pcol
    conditional_summary "PLAYER_MOVE" $::interval_ms $::interval_move
    say [format "EVENT_SPIKES over20ms=%d" $::event_spikes]
    say [format "COUNTS frames=%d boss=%d launch=%d restore=%d boss_color=%d player_color=%d move=%d" $::frame_count [llength $::interval_boss] [llength $::interval_launch] [llength $::interval_restore] [llength $::interval_bcol] [llength $::interval_pcol] [llength $::interval_move]]
    close $::f
    exit
}
say "test607_frame_profile"
