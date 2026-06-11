proc rd {addr} { return [debug read memory $addr] }
proc wr {addr val} { debug write memory $addr $val }
proc st {} { return "x=[rd 0xC000] y=[rd 0xC001] side=[rd 0xC079] vx=[rd 0xC07B] kl=[rd 0xC07C]" }
set ::log {}
proc note {msg} { lappend ::log $msg }
set ::taps 0
proc tapLoop {} {
    if {$::taps >= 14} {
        note "climb_end [st]"
        screenshot test/wj_03_arriba.png
        after time 1.0 {
            note "slide_mid [st]"
            screenshot test/wj_04_bajando_friccion.png
            after time 2.0 {
                note "rest [st]"
                set fh [open "test/wj_climb.txt" w]
                foreach l $::log { puts $fh $l }
                close $fh
                exit
            }
        }
        return
    }
    incr ::taps
    keymatrixdown 4 0x08
    after time 0.1 {
        keymatrixup 4 0x08
        note "tap$::taps [st]"
        if {$::taps == 7} { screenshot test/wj_02_escalando.png }
        after time 0.08 { tapLoop }
    }
}
after time 5 {
    wr 0xC000 208
    wr 0xC001 90
    after time 0.6 {
        note "floor [st]"
        screenshot test/wj_01_suelo_chimenea.png
        keymatrixdown 8 0x01
        after time 0.2 {
            keymatrixup 8 0x01
            after time 0.05 { tapLoop }
        }
    }
}
