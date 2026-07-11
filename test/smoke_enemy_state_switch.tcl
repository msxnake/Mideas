proc rd {addr} { return [debug read memory $addr] }
set ::log {}
proc note {msg} { lappend ::log $msg }
proc flush_log {} {
    set fh [open "test/smoke_enemy_state_switch.txt" w]
    foreach l $::log { puts $fh $l }
    close $fh
}

after time 6 {
    set ex [rd 0xC5F0]
    set ey [rd 0xC5FC]
    note "initial mode=[rd 0xC620] enemy_x=$ex enemy_y=$ey"
    debug write memory 0xC000 [expr {$ex + 30}]
    debug write memory 0xC001 [expr {$ey + 4}]
    after time 0.3 {
        note "near mode=[rd 0xC620] player_x=[rd 0xC000] player_y=[rd 0xC001]"
        debug write memory 0xC000 16
        debug write memory 0xC001 16
        after time 0.3 {
            note "far mode=[rd 0xC620] player_x=[rd 0xC000] player_y=[rd 0xC001]"
            flush_log
            exit
        }
    }
}
