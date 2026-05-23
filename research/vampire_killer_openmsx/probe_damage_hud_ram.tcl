set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_damage_hud_ram.log" "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc state {tag} { logline [format "%s PC=%04X SP=%04X AF=%04X BC=%04X DE=%04X HL=%04X IX=%04X IY=%04X" $tag [reg PC] [reg SP] [reg AF] [reg BC] [reg DE] [reg HL] [reg IX] [reg IY]] }
proc shot {name tag} { global out_dir; state $tag; screenshot "$out_dir/$name"; logline "SHOT $name" }
proc m {addr} { return [debug read memory $addr] }
proc dump_line {start len label} {
    set parts {}
    for {set i 0} {$i < $len} {incr i} { lappend parts [format "%02X" [m [expr {$start+$i}]]] }
    logline [format "%s %04X %s" $label $start [join $parts " "]]
}
proc kd {row mask label} { keymatrixdown $row $mask; logline "KD row=$row mask=$mask $label" }
proc ku {row mask label} { keymatrixup $row $mask; logline "KU row=$row mask=$mask $label" }
proc snapshot {tag} {
    state $tag
    dump_line 0xC000 0x80 "${tag}_C000"
    dump_line 0xC400 0xB0 "${tag}_C400"
    dump_line 0xC800 0x80 "${tag}_C800"
}

set ::active 0
set ::phase 0
set ::first 0
set ::r17 -1
array set ::cmdregs {}
set ::hud_cmd_count 0
set ::c4w_count 0
set ::c0w_count 0

proc getreg {n} { if {[info exists ::cmdregs($n)]} { return $::cmdregs($n) }; return 0 }
proc cmd_seen {} {
    set dx [expr {[getreg 36] | ([getreg 37] << 8)}]
    set dy [expr {[getreg 38] | ([getreg 39] << 8)}]
    set nx [expr {[getreg 40] | ([getreg 41] << 8)}]
    set ny [expr {[getreg 42] | ([getreg 43] << 8)}]
    set col [getreg 44]
    set cmd [getreg 46]
    if {$dy < 32} {
        incr ::hud_cmd_count
        if {$::hud_cmd_count <= 120} {
            logline [format "HUDCMD_%03d dx=%03d dy=%03d nx=%03d ny=%03d col=%02X cmd=%02X PC=%04X" $::hud_cmd_count $dx $dy $nx $ny $col $cmd [reg PC]]
        }
    }
}

debug set_watchpoint write_io 0x99 {} {
    if {$::active} {
        set v $::wp_last_value
        if {$::phase == 0} { set ::first $v; set ::phase 1 } else {
            set first $::first; set ::phase 0
            if {($v & 0x80) != 0 && (($v & 0x3f) == 17)} { set ::r17 [expr {$first & 0x3f}] }
        }
    }
    debug cont
}
debug set_watchpoint write_io 0x9B {} {
    if {$::active && $::r17 >= 0} {
        set ::cmdregs($::r17) $::wp_last_value
        if {$::r17 == 46} { cmd_seen }
        incr ::r17
    }
    debug cont
}
debug set_watchpoint write_mem {0xC400 0xC4AF} {} {
    if {$::active} {
        incr ::c4w_count
        if {$::c4w_count <= 120} { logline [format "C4W_%03d %04X=%02X PC=%04X IX=%04X HL=%04X" $::c4w_count $::wp_last_address $::wp_last_value [reg PC] [reg IX] [reg HL]] }
    }
    debug cont
}
debug set_watchpoint write_mem {0xC000 0xC0BF} {} {
    if {$::active} {
        incr ::c0w_count
        if {$::c0w_count <= 160} { logline [format "C0W_%03d %04X=%02X PC=%04X IX=%04X HL=%04X" $::c0w_count $::wp_last_address $::wp_last_value [reg PC] [reg IX] [reg HL]] }
    }
    debug cont
}

logline "RUN damage/hud ram"
after time 9.0 { kd 8 1 "SPACE1" }
after time 9.2 { ku 8 1 "SPACE1" }
after time 12.0 { kd 8 1 "SPACE2" }
after time 12.2 { ku 8 1 "SPACE2" }
after time 22.0 { set ::active 1; shot "damage_22_start.png" "DAMAGE_START"; snapshot "DAMAGE_START" }

# Walk into the first flame / hazards for a while.
after time 22.2 { kd 8 128 "RIGHT" }
after time 27.8 { ku 8 128 "RIGHT" }
after time 24.5 { shot "damage_24_mid_walk.png" "DAMAGE_MID_WALK"; snapshot "DAMAGE_MID_WALK" }
after time 28.0 { shot "damage_28_after_walk.png" "DAMAGE_AFTER_WALK"; snapshot "DAMAGE_AFTER_WALK" }

# Try action near hazards.
after time 28.2 { kd 8 1 "SPACE_ACTION" }
after time 28.7 { ku 8 1 "SPACE_ACTION" }
after time 29.0 { shot "damage_29_after_space.png" "DAMAGE_AFTER_SPACE"; snapshot "DAMAGE_AFTER_SPACE" }

after time 29.5 {
    logline [format "COUNTS hud_cmd=%d c0w=%d c4w=%d" $::hud_cmd_count $::c0w_count $::c4w_count]
    close $::f
    exit
}
