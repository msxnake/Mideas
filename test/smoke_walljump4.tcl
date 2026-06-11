proc rd {addr} { return [debug read memory $addr] }
proc wr {addr val} { debug write memory $addr $val }
proc st {} { return "x=[rd 0xC000] y=[rd 0xC001] side=[rd 0xC079] lock=[rd 0xC07A] keylock=[rd 0xC07C]" }
set ::log {}
proc note {msg} { lappend ::log $msg }
after time 5 {
    # Fake solid wall column at col 2 (x=32..47), rows 8..10 (y=128..191)
    set ptr [expr {[rd 0xC004] + ([rd 0xC005] << 8)}]
    wr [expr {$ptr + 8*16 + 2}] 1
    wr [expr {$ptr + 9*16 + 2}] 1
    wr [expr {$ptr + 10*16 + 2}] 1
    # Move box3 (floor, x=80) out of the way: runtime_x[3]=230, clear its map cell (row10,col5)
    wr 0xC052 230
    wr [expr {$ptr + 10*16 + 5}] 0
    note "setup ptr=$ptr [st]"
    keymatrixdown 8 0x10
    after time 2.5 {
        keymatrixup 8 0x10
        note "at_wall1 [st]"
        after time 0.05 {
            keymatrixdown 8 0x01
            after time 0.1 {
                note "during1 [st]"
                after time 0.3 {
                    keymatrixup 8 0x01
                    note "kick1 [st]"
                    after time 1.2 {
                        note "settle1 [st]"
                        keymatrixdown 8 0x10
                        after time 1.2 {
                            keymatrixup 8 0x10
                            note "at_wall2 [st]"
                            after time 0.05 {
                                keymatrixdown 8 0x01
                                after time 0.1 {
                                    note "during2 [st]"
                                    after time 0.3 {
                                        keymatrixup 8 0x01
                                        note "kick2 [st]"
                                        after time 1 {
                                            note "final [st]"
                                            set fh [open "test/smoke_walljump4.txt" w]
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
    }
}
