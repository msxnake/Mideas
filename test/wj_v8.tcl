proc rd {addr} { return [debug read memory $addr] }
proc wr {addr val} { debug write memory $addr $val }
proc st {} { return "x=[rd 0xC000] y=[rd 0xC001] side=[rd 0xC079] vx=[rd 0xC07B]" }
set ::log {}
proc note {msg} { lappend ::log $msg }
after time 5 {
    wr 0xC000 208
    wr 0xC001 90
    after time 0.6 {
        note "floor [st]"
        keymatrixdown 8 0x01
        after time 0.2 {
            keymatrixup 8 0x01
            after time 0.1 {
                keymatrixdown 4 0x08
                after time 0.1 {
                    keymatrixup 4 0x08
                    note "kick1 [st]"
                    after time 0.25 {
                        note "kick1_rise [st]"
                        screenshot test/wj_07_v8_kick1.png
                        keymatrixdown 4 0x08
                        after time 0.1 {
                            keymatrixup 4 0x08
                            note "kick2 [st]"
                            after time 0.25 {
                                note "kick2_rise [st]"
                                screenshot test/wj_08_v8_kick2.png
                                after time 1.5 {
                                    note "rest [st]"
                                    set fh [open "test/wj_v8.txt" w]
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
}
