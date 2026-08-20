# Trajectory probe: does the boss actually patrol after a transition entry?
# The H3 verdict needs "move the boss several ticks" to be true; a POST reading
# of x=60 alone cannot distinguish "never moved" from "returned to the turn".
set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set LOG [open "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551-h3-traj.log" w]
proc say {m} { global LOG; puts $LOG $m; flush $LOG }

set SYM [dict create]
set fh [open $SYMFILE r]
set symtext [read $fh]
close $fh
foreach line [split $symtext "\n"] {
    if {[regexp {^([A-Za-z_][A-Za-z0-9_]*): equ ([0-9A-Fa-f]+)H} [string trim $line] -> name hex]} {
        scan $hex %x addr
        dict set SYM $name $addr
    }
}
set R_x [dict get $SYM boss_x]
set R_o [dict get $SYM boss_old_x]
set R_a [dict get $SYM boss_active]
set R_s [dict get $SYM current_screen_index]

after time 2.000 { keymatrixdown 8 0x80 ; say "holding RIGHT" }

proc sample {} {
    global R_x R_o R_a R_s LOG
    say [format "t=%.3f x=%d old=%d active=%d screen=%d" [machine_info time] \
        [debug read memory $R_x] [debug read memory $R_o] [debug read memory $R_a] [debug read memory $R_s]]
    if {[machine_info time] < 15.5} {
        after time 0.250 { sample }
    } else {
        close $LOG
        after time 0.100 { exit }
    }
}
after time 6.000 { sample }
debug cont
