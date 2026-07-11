proc rd {addr} { return [debug read memory $addr] }
proc st {} { return "x=[rd 0xC000] y=[rd 0xC001] side=[rd 0xC079] keylock=[rd 0xC07C]" }
set ::log {}
proc note {msg} { lappend ::log $msg }
proc attempt {n next} {
    keymatrixdown 8 0x80
    after time 1.5 {
        keymatrixup 8 0x80
        note "at_wall$::cnt [st]"
        after time 0.05 {
            keymatrixdown 8 0x01
            after time 0.4 {
                keymatrixup 8 0x01
                note "kick$::cnt [st]"
                after time 1.2 {
                    note "settle$::cnt [st]"
                    uplevel #0 $::next_cb
                }
            }
        }
    }
}
set ::cnt 1
set ::next_cb {
    set ::cnt 2
    set ::next_cb {
        set ::cnt 3
        set ::next_cb {
            set fh [open "test/smoke_walljump2.txt" w]
            foreach l $::log { puts $fh $l }
            close $fh
            exit
        }
        attempt 3 x
    }
    attempt 2 x
}
after time 5 { attempt 1 x }
