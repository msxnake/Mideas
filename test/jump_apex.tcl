proc rd {addr} { return [debug read memory $addr] }
set ::log {}
proc note {m} { lappend ::log $m }
set ::apex 255
set ::cnt 0
set ::phase 0
proc poll {} {
    set y [rd 0xC001]
    if {$y < $::apex} { set ::apex $y }
    incr ::cnt
    if {$::cnt == 6} { keymatrixup 8 0x01 }
    if {$::cnt >= 32} {
        note "jump$::phase apex=$::apex yend=$y flags=[rd 0xC00A]"
        nextPhase
        return
    }
    after time 0.033 poll
}
proc startJump {} {
    set ::apex 255
    set ::cnt 0
    keymatrixdown 8 0x01
    poll
}
proc nextPhase {} {
    incr ::phase
    if {$::phase <= 2} { startJump; return }
    if {$::phase == 3} {
        # jump then air-dash with N mid-air
        keymatrixdown 8 0x01
        after time 0.15 {
            keymatrixup 8 0x01
            keymatrixdown 4 0x08
            after time 0.1 {
                keymatrixup 4 0x08
                note "dash adt=[rd 0xC07D] x=[rd 0xC000] y=[rd 0xC001]"
                after time 0.9 {
                    note "landed y=[rd 0xC001] flags=[rd 0xC00A]"
                    nextPhase
                }
            }
        }
        return
    }
    if {$::phase == 4} { startJump; return }
    set fh [open "test/jump_apex.txt" w]
    foreach l $::log { puts $fh $l }
    close $fh
    exit
}
after time 5 {
    note "boot y=[rd 0xC001] flags=[rd 0xC00A]"
    set ::phase 0
    startJump
}
