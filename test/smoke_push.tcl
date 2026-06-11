proc rd {addr} { return [debug read memory $addr] }
proc boxes {} {
    set n [rd 0xC047]
    set out "n=$n"
    for {set i 0} {$i < $n} {incr i} {
        append out " b$i=([rd [expr 0xC04F + $i]],[rd [expr 0xC057 + $i]])"
    }
    return $out
}
set ::log {}
proc note {msg} { lappend ::log $msg }
after time 5 {
    note "start px=[rd 0xC000] py=[rd 0xC001] [boxes]"
    keymatrixdown 8 0x80
    after time 2 {
        keymatrixup 8 0x80
        note "after_right px=[rd 0xC000] py=[rd 0xC001] [boxes]"
        keymatrixdown 8 0x10
        after time 3.5 {
            keymatrixup 8 0x10
            note "after_left px=[rd 0xC000] py=[rd 0xC001] [boxes]"
            set fh [open $::env(SMOKE_OUT) w]
            foreach l $::log { puts $fh $l }
            close $fh
            exit
        }
    }
}
