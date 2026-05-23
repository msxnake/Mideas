set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_hud_command_summary.log" "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc st {} { return [format "PC=%04X AF=%04X BC=%04X DE=%04X HL=%04X" [reg PC] [reg AF] [reg BC] [reg DE] [reg HL]] }

set ::active 0
set ::phase 0
set ::first 0
set ::r17 -1
array set ::cmdregs {}
set ::hud_cmd_count 0
set ::all_cmd_count 0
set ::data98_count 0

proc getreg {n} {
    if {[info exists ::cmdregs($n)]} { return $::cmdregs($n) }
    return 0
}

proc command_seen {} {
    incr ::all_cmd_count
    set sx [expr {[getreg 32] | ([getreg 33] << 8)}]
    set sy [expr {[getreg 34] | ([getreg 35] << 8)}]
    set dx [expr {[getreg 36] | ([getreg 37] << 8)}]
    set dy [expr {[getreg 38] | ([getreg 39] << 8)}]
    set nx [expr {[getreg 40] | ([getreg 41] << 8)}]
    set ny [expr {[getreg 42] | ([getreg 43] << 8)}]
    set col [getreg 44]
    set arg [getreg 45]
    set cmd [getreg 46]
    set op [expr {$cmd & 0xf0}]
    set lop [expr {$cmd & 0x0f}]
    if {$dy < 64 || $sy < 64 || ($dy < 80 && $ny <= 16)} {
        incr ::hud_cmd_count
        logline [format "HUDCMD_%03d all=%04d op=%02X lop=%X sx=%03d sy=%03d dx=%03d dy=%03d nx=%03d ny=%03d col=%02X arg=%02X cmd=%02X %s" $::hud_cmd_count $::all_cmd_count $op $lop $sx $sy $dx $dy $nx $ny $col $arg $cmd [st]]
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
    if {$::active} {
        if {$::r17 >= 0} {
            set ::cmdregs($::r17) $::wp_last_value
            if {$::r17 == 46} { command_seen }
            incr ::r17
        }
    }
    debug cont
}

debug set_watchpoint write_io 0x98 {} {
    if {$::active} { incr ::data98_count }
    debug cont
}

after time 10.5 { keymatrixdown 8 1; logline "INPUT SPACE DOWN" }
after time 10.7 { keymatrixup 8 1; set ::active 1; logline "TRACE_ACTIVE_AFTER_SPACE" }
after time 18.0 {
    screenshot "$out_dir/hud_command_summary_18s.png"
    logline [format "COUNTS all_cmd=%d hud_cmd=%d port98=%d" $::all_cmd_count $::hud_cmd_count $::data98_count]
    close $::f
    exit
}
