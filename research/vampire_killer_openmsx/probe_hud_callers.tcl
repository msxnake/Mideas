set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_hud_callers.log" "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {a} { return [debug read memory $a] }
proc retaddr {} {
    set sp [reg SP]
    set lo [mem8 $sp]
    set hi [mem8 [expr {$sp + 1}]]
    return [expr {$lo | ($hi << 8)}]
}
proc st {} { return [format "PC=%04X SP=%04X RET=%04X AF=%04X BC=%04X DE=%04X HL=%04X IX=%04X IY=%04X" [reg PC] [reg SP] [retaddr] [reg AF] [reg BC] [reg DE] [reg HL] [reg IX] [reg IY]] }

set ::active 0
set ::phase 0
set ::first 0
set ::r17 -1
array set ::cmdregs {}
set ::hud_count 0
array set ::ret_counts {}

proc getreg {n} { if {[info exists ::cmdregs($n)]} { return $::cmdregs($n) }; return 0 }
proc command_seen {} {
    set sx [expr {[getreg 32] | ([getreg 33] << 8)}]
    set sy [expr {[getreg 34] | ([getreg 35] << 8)}]
    set dx [expr {[getreg 36] | ([getreg 37] << 8)}]
    set dy [expr {[getreg 38] | ([getreg 39] << 8)}]
    set nx [expr {[getreg 40] | ([getreg 41] << 8)}]
    set ny [expr {[getreg 42] | ([getreg 43] << 8)}]
    set col [getreg 44]
    set arg [getreg 45]
    set cmd [getreg 46]
    if {$dy < 32 || ($dx >= 56 && $dx <= 250 && $dy < 32)} {
        incr ::hud_count
        set ra [format "%04X" [retaddr]]
        if {[info exists ::ret_counts($ra)]} { incr ::ret_counts($ra) } else { set ::ret_counts($ra) 1 }
        if {$::hud_count <= 120} {
            logline [format "HUDCALL_%03d sx=%03d sy=%03d dx=%03d dy=%03d nx=%03d ny=%03d col=%02X arg=%02X cmd=%02X %s" $::hud_count $sx $sy $dx $dy $nx $ny $col $arg $cmd [st]]
        }
    }
}

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
                if {$reg == 17} { set ::r17 [expr {$first & 0x3f}] }
            }
        }
    }
    debug cont
}

debug set_watchpoint write_io 0x9B {} {
    if {$::active && $::r17 >= 0} {
        set ::cmdregs($::r17) $::wp_last_value
        if {$::r17 == 46} { command_seen }
        incr ::r17
    }
    debug cont
}

after time 10.5 { keymatrixdown 8 1; logline "INPUT SPACE DOWN" }
after time 10.7 { keymatrixup 8 1; set ::active 1; logline "TRACE_ACTIVE_AFTER_SPACE" }
after time 18.0 {
    logline [format "COUNTS hud=%d" $::hud_count]
    foreach ra [lsort [array names ::ret_counts]] { logline [format "RET_SUM %s %d" $ra $::ret_counts($ra)] }
    close $::f
    exit
}
