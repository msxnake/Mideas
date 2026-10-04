# Main-loop cadence probe for test607_edge_sync.
set root "C:/Users/salam/Documents/Programacion/Mideas/work"
set f [open "$root/test607_edge_sync_rate_probe.txt" w]
set sf [open "$root/test607_edge_sync.sym" r]
set syms [read $sf]
close $sf
proc sym {label} {
    if {![regexp -line "^${label}: equ (\[0-9A-Fa-f\]+)H" $::syms -> hex]} { error "Missing symbol $label" }
    scan $hex %x addr
    return $addr
}
set loop_addr [sym bitmap_enter_game_loop]
set count 0
set first_time -1
set last_time -1
set window_count 0
set window_start -1
set window_end -1
proc loop_bp {} {
    global count first_time last_time window_count window_start window_end
    incr count
    set t [machine_info time]
    if {$first_time < 0} { set first_time $t }
    if {$t >= 15.0 && $window_start < 0} { set window_start $t }
    if {$t >= 15.0 && $t < 35.0} { incr window_count }
    if {$t >= 35.0 && $window_end < 0} { set window_end $t }
    set last_time $t
    if {($count <= 3) || (($count % 120) == 0)} {
        puts $::f [format "LOOP count=%d t=%.3f screen=%d boss=%d" $count $t [debug read memory [sym current_screen_index]] [debug read memory [sym boss_active]]]
        flush $::f
    }
    debug cont
}
debug set_bp $loop_addr {} { loop_bp }

# Enter game and reach pan18 with the same route used by the SAT probes.
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
after time 40 {
    set duration [expr {$::window_end - $::window_start}]
    puts $::f [format "RESULT total=%d window_loops=%d window_seconds=%.3f loops_per_second=%.2f" $::count $::window_count $duration [expr {$::window_count / $duration}]]
    flush $::f
    close $::f
    exit
}
puts $f "test607_edge_sync_rate_probe"
flush $f
