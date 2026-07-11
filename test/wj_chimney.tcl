proc rd {addr} { return [debug read memory $addr] }
proc wr {addr val} { debug write memory $addr $val }
proc st {} { return "x=[rd 0xC000] y=[rd 0xC001] side=[rd 0xC079] tmr=[rd 0xC07A] vx=[rd 0xC07B]" }
set ::log {}
proc note {msg} { lappend ::log $msg }
proc tapN {next} {
    keymatrixdown 4 0x08
    after time 0.12 {
        keymatrixup 4 0x08
        uplevel #0 $::tap_next
    }
}
after time 5 {
    # Place player inside the chimney (col 13 shaft, x=208)
    wr 0xC000 208
    wr 0xC001 90
    after time 0.6 {
        note "shaft_floor [st]"
        screenshot test/wj_01_suelo_chimenea.png
        keymatrixdown 8 0x01
        after time 0.25 {
            keymatrixup 8 0x01
            note "jumped [st]"
            set ::tap_next {
                after time 0.05 {
                    note "kick1 [st]"
                    screenshot test/wj_02_kick1.png
                    set ::tap_next {
                        after time 0.05 {
                            note "kick2 [st]"
                            screenshot test/wj_03_kick2.png
                            set ::tap_next {
                                after time 0.05 {
                                    note "kick3 [st]"
                                    screenshot test/wj_04_kick3.png
                                    set ::tap_next {
                                        after time 0.05 {
                                            note "kick4 [st]"
                                            screenshot test/wj_05_kick4.png
                                            note "slide_start [st]"
                                            after time 0.3 {
                                                note "slide_18f [st]"
                                                screenshot test/wj_06_friccion.png
                                                after time 0.3 {
                                                    note "slide_36f [st]"
                                                    after time 1.5 {
                                                        note "rest [st]"
                                                        set fh [open "test/wj_chimney.txt" w]
                                                        foreach l $::log { puts $fh $l }
                                                        close $fh
                                                        exit
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    after time 0.25 { tapN x }
                                }
                            }
                            after time 0.25 { tapN x }
                        }
                    }
                    after time 0.25 { tapN x }
                }
            }
            after time 0.1 { tapN x }
        }
    }
}
