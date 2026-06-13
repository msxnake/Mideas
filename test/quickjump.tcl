proc rd {addr} { return [debug read memory $addr] }
set ::log {}
proc note {m} { lappend ::log $m }
after time 5 {
    note "boot y=[rd 0xC001] flags=[rd 0xC00A]"
    keymatrixdown 8 0x01
    after time 0.18 {
        note "midjump y=[rd 0xC001] flags=[rd 0xC00A]"
        keymatrixup 8 0x01
        after time 0.5 {
            note "after y=[rd 0xC001] flags=[rd 0xC00A]"
            keymatrixdown 8 0x80
            after time 0.4 {
                keymatrixup 8 0x80
                note "right x=[rd 0xC000]"
                set fh [open $::env(OUT) w]
                foreach l $::log { puts $fh $l }
                close $fh
                exit
            }
        }
    }
}
