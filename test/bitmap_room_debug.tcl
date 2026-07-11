proc rd {a} { return [debug read memory $a] }
set ::log {}
proc note {m} { lappend ::log $m }
after time 10 {
    note "boot x=[rd 0xC001] frame=[rd 0xC009] marker=[rd 0xC00A] gtstck=[rd 0xC008]"
    keymatrixdown 8 0x80 ;# RIGHT
    after time 1 {
        note "right1 x=[rd 0xC001] frame=[rd 0xC009] gtstck=[rd 0xC008]"
        after time 1 {
            note "right2 x=[rd 0xC001] frame=[rd 0xC009] gtstck=[rd 0xC008]"
            keymatrixup 8 0x80
            set fh [open $::env(OUT) w]
            foreach l $::log { puts $fh $l }
            close $fh
            exit
        }
    }
}
