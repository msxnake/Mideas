set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_hud_ports_9b.log" "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc st {} { return [format "PC=%04X AF=%04X BC=%04X DE=%04X HL=%04X IX=%04X IY=%04X" [reg PC] [reg AF] [reg BC] [reg DE] [reg HL] [reg IX] [reg IY]] }

set ::active 0
set ::phase 0
set ::first 0
set ::r17 -1
set ::port9b_count 0
set ::port98_count 0
array set ::pc98 {}
array set ::pc9b {}

debug set_watchpoint write_io 0x99 {} {
    if {$::active} {
        set v $::wp_last_value
        if {$::phase == 0} {
            set ::first $v
            set ::phase 1
        } else {
            set first $::first
            set ::phase 0
            if {($v & 0x80) != 0} {
                set reg [expr {$v & 0x3f}]
                if {$reg == 17} {
                    set ::r17 [expr {$first & 0x3f}]
                    logline [format "SET_R17 val=%02X indirect_reg=%02d %s" $first $::r17 [st]]
                }
                if {$reg == 14 || $reg == 17 || ($reg >= 32 && $reg <= 46)} {
                    logline [format "SET_REG R%02d=%02X %s" $reg $first [st]]
                }
            }
        }
    }
    debug cont
}

debug set_watchpoint write_io 0x9B {} {
    if {$::active} {
        incr ::port9b_count
        set pc [format "%04X" [reg PC]]
        if {[info exists ::pc9b($pc)]} { incr ::pc9b($pc) } else { set ::pc9b($pc) 1 }
        if {$::port9b_count <= 360} {
            logline [format "PORT9B_%03d reg=%02d val=%02X %s" $::port9b_count $::r17 $::wp_last_value [st]]
        }
        if {$::r17 >= 0 && ($::r17 & 0x80) == 0} { incr ::r17 }
    }
    debug cont
}

debug set_watchpoint write_io 0x98 {} {
    if {$::active} {
        incr ::port98_count
        set pc [format "%04X" [reg PC]]
        if {[info exists ::pc98($pc)]} { incr ::pc98($pc) } else { set ::pc98($pc) 1 }
        if {$::port98_count <= 120} {
            logline [format "PORT98_%03d val=%02X %s" $::port98_count $::wp_last_value [st]]
        }
    }
    debug cont
}

after time 10.5 { keymatrixdown 8 1; logline "INPUT SPACE DOWN" }
after time 10.7 { keymatrixup 8 1; set ::active 1; logline "TRACE_ACTIVE_AFTER_SPACE" }
after time 18.0 {
    screenshot "$out_dir/hud_ports_18s.png"
    logline [format "COUNTS port98=%d port9b=%d" $::port98_count $::port9b_count]
    foreach pc [lsort [array names ::pc98]] { logline [format "PC98_SUM %s %d" $pc $::pc98($pc)] }
    foreach pc [lsort [array names ::pc9b]] { logline [format "PC9B_SUM %s %d" $pc $::pc9b($pc)] }
    close $::f
    exit
}
