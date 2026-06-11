proc rd {addr} { return [debug read memory $addr] }
proc r18 {} { return [debug read "VDP regs" 18] }
set ::log {}
proc note {m} { lappend ::log $m }
after time 5 {
    note "boot y=[rd 0xC001] flags=[rd 0xC00A] r18=[r18]"
    keymatrixdown 8 0x01
    after time 0.18 {
        keymatrixup 8 0x01
        after time 0.1 {
            note "airborne y=[rd 0xC001] flags=[rd 0xC00A] active=[rd 0xC07D]"
            keymatrixdown 8 0x40
            keymatrixdown 4 0x08
            after time 0.05 {
                note "stomp_on y=[rd 0xC001] active=[rd 0xC07D] gvhi=[rd 0xC009]"
                set ::n 0
                proc poll {} {
                    incr ::n
                    note "p$::n y=[rd 0xC001] active=[rd 0xC07D] shake=[rd 0xC07F] r18=[r18]"
                    if {[rd 0xC07F] != 0} { screenshot test/stomp_shake_$::n.png }
                    if {$::n >= 14} {
                        keymatrixup 8 0x40
                        keymatrixup 4 0x08
                        note "end y=[rd 0xC001] shake=[rd 0xC07F] r18=[r18]"
                        set fh [open "test/smoke_stomp.txt" w]
                        foreach l $::log { puts $fh $l }
                        close $fh
                        exit
                    }
                    after time 0.033 poll
                }
                poll
            }
        }
    }
}
