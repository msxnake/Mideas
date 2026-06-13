# Phase 1 verification (real-BIOS MSX2 boots slowly): wait for the cart, then
# drive RIGHT and confirm the player advances from spawn (px 48) and is stopped
# by the interior wall at col 8 (right edge blocked near px 112), then LEFT
# returns it toward the left border. Player RAM: X=#C001, Y=#C000.
proc rd {a} { return [debug read memory $a] }
set ::log {}
proc note {m} { lappend ::log $m }
after time 10 {
    note "boot x=[rd 0xC001] y=[rd 0xC000]"
    keymatrixdown 8 0x80 ;# RIGHT
    after time 1 {
        note "right_1s x=[rd 0xC001]"
        after time 1 {
            note "right_2s x=[rd 0xC001]"
            after time 1 {
                note "right_3s x=[rd 0xC001]"
                keymatrixup 8 0x80
                keymatrixdown 8 0x10 ;# LEFT
                after time 3 {
                    note "left_3s x=[rd 0xC001]"
                    keymatrixup 8 0x10
                    set fh [open $::env(OUT) w]
                    foreach l $::log { puts $fh $l }
                    close $fh
                    exit
                }
            }
        }
    }
}
