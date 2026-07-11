proc rd {addr} { return [debug read memory $addr] }
proc st {} { return "x=[rd 0xC000] y=[rd 0xC001] side=[rd 0xC079] lock=[rd 0xC07A] keylock=[rd 0xC07C]" }
set ::log {}
proc note {msg} { lappend ::log $msg }
after time 5 {
    keymatrixdown 8 0x80
    after time 1 {
        keymatrixup 8 0x80
        note "at_wall [st]"
        after time 0.05 {
            keymatrixdown 8 0x01
            after time 0.15 {
                note "kick_mid [st]"
                after time 0.25 {
                    keymatrixup 8 0x01
                    note "kick_end [st]"
                    after time 1 {
                        note "landed [st]"
                        # ---- second attempt ----
                        keymatrixdown 8 0x80
                        after time 1 {
                            keymatrixup 8 0x80
                            note "at_wall2 [st]"
                            after time 0.05 {
                                keymatrixdown 8 0x01
                                after time 0.4 {
                                    keymatrixup 8 0x01
                                    note "kick2_end [st]"
                                    after time 1 {
                                        note "final [st]"
                                        set fh [open "test/smoke_walljump.txt" w]
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
