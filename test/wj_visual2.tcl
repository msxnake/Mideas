proc rd {addr} { return [debug read memory $addr] }
proc wr {addr val} { debug write memory $addr $val }
proc st {} { return "x=[rd 0xC000] y=[rd 0xC001] side=[rd 0xC079] vx=[rd 0xC07B]" }
set ::log {}
proc note {msg} { lappend ::log $msg }
set ::taps 0
proc tapLoop {} {
    if {$::taps >= 4} { afterClimb; return }
    incr ::taps
    keymatrixdown 4 0x08
    after time 0.1 {
        keymatrixup 4 0x08
        note "tap$::taps [st]"
        if {$::taps == 3} { screenshot test/wj_02_escalando.png }
        after time 0.08 { tapLoop }
    }
}
proc afterClimb {} {
    # Part B: committed flight from outer wall with cursors held
    wr 0xC000 175
    wr 0xC001 112
    wr 0xC07B 0
    wr 0xC07A 0
    after time 0.5 {
        note "B_at_tower [st]"
        keymatrixdown 8 0x01
        after time 0.2 {
            keymatrixup 8 0x01
            keymatrixdown 4 0x08
            keymatrixdown 8 0x80
            after time 0.15 {
                keymatrixup 4 0x08
                note "B_kick_holding_right [st]"
                after time 0.3 {
                    note "B_flight1 [st]"
                    screenshot test/wj_05_vuelo_cursores.png
                    after time 0.3 {
                        note "B_flight2 [st]"
                        after time 0.8 {
                            keymatrixup 8 0x80
                            note "B_landed [st]"
                            keymatrixdown 8 0x80
                            after time 0.5 {
                                keymatrixup 8 0x80
                                note "B_ground_right [st]"
                                screenshot test/wj_06_control_recuperado.png
                                set fh [open "test/wj_visual2.txt" w]
                                foreach l $::log { puts $fh $l }
                                close $fh
                                exit
                            }
                        }
                    }
                }
            }
        }
    }
}
after time 5 {
    wr 0xC000 208
    wr 0xC001 90
    after time 0.6 {
        keymatrixdown 8 0x01
        after time 0.2 {
            keymatrixup 8 0x01
            after time 0.05 { tapLoop }
        }
    }
}
