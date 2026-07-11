proc rd {addr} { return [debug read memory $addr] }
set ::log {}
proc note {m} { lappend ::log $m }
after time 5 {
    note "boot x=[rd 0xC000] y=[rd 0xC001] flags=[rd 0xC00A]"
    keymatrixdown 8 0x80
    after time 0.5 {
        keymatrixup 8 0x80
        note "after_right x=[rd 0xC000]"
        keymatrixdown 8 0x01
        after time 0.15 {
            note "jump_peak y=[rd 0xC001]"
            keymatrixup 8 0x01
            after time 0.4 {
                note "after_jump y=[rd 0xC001]"
                set fh [open $::env(OUT) w]
                foreach l $::log { puts $fh $l }
                close $fh
                exit
            }
        }
    }
}
