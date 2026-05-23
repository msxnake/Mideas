set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_door_transition_focus.log" "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc state {tag} { logline [format "%s PC=%04X SP=%04X AF=%04X BC=%04X DE=%04X HL=%04X IX=%04X IY=%04X" $tag [reg PC] [reg SP] [reg AF] [reg BC] [reg DE] [reg HL] [reg IX] [reg IY]] }
proc shot {name tag} { global out_dir; state $tag; screenshot "$out_dir/$name"; logline "SHOT $name" }
proc m {addr} { return [debug read memory $addr] }
proc dump_bytes_to_file {space start len filename} {
    global out_dir
    set bf [open "$out_dir/$filename" "wb"]
    fconfigure $bf -translation binary
    for {set i 0} {$i < $len} {incr i} {
        set v [debug read $space [expr {$start + $i}]]
        puts -nonewline $bf [binary format c [expr {$v & 0xff}]]
    }
    close $bf
    logline [format "DUMP %s %s:%04X len=%d" $filename $space $start $len]
}
proc vars {tag} {
    logline [format "%s C000=%02X C001=%02X C002=%02X C003=%02X C004=%02X C005=%02X C00F=%02X C410=%02X:%02X:%02X:%02X C426=%02X%02X C42E=%02X C42F=%02X" \
        $tag [m 0xC000] [m 0xC001] [m 0xC002] [m 0xC003] [m 0xC004] [m 0xC005] [m 0xC00F] \
        [m 0xC410] [m 0xC411] [m 0xC412] [m 0xC413] [m 0xC427] [m 0xC426] [m 0xC42E] [m 0xC42F]]
}
proc kd {row mask label} { keymatrixdown $row $mask; logline "KD row=$row mask=$mask $label" }
proc ku {row mask label} { keymatrixup $row $mask; logline "KU row=$row mask=$mask $label" }

set ::active 0
set ::phase 0
set ::first 0
set ::r17 -1
array set ::cmdregs {}
set ::hud_cmd_count 0
set ::screen_cmd_count 0
set ::c0_count 0
set ::map_count 0

proc getreg {n} { if {[info exists ::cmdregs($n)]} { return $::cmdregs($n) }; return 0 }
proc cmd_seen {} {
    set sx [expr {[getreg 32] | ([getreg 33] << 8)}]
    set sy [expr {[getreg 34] | ([getreg 35] << 8)}]
    set dx [expr {[getreg 36] | ([getreg 37] << 8)}]
    set dy [expr {[getreg 38] | ([getreg 39] << 8)}]
    set nx [expr {[getreg 40] | ([getreg 41] << 8)}]
    set ny [expr {[getreg 42] | ([getreg 43] << 8)}]
    set col [getreg 44]
    set cmd [getreg 46]
    if {$dy < 32} {
        incr ::hud_cmd_count
        if {$::hud_cmd_count <= 80} { logline [format "HUDCMD_%03d sx=%03d sy=%03d dx=%03d dy=%03d nx=%03d ny=%03d col=%02X cmd=%02X PC=%04X" $::hud_cmd_count $sx $sy $dx $dy $nx $ny $col $cmd [reg PC]] }
    } elseif {$dy < 212 || $ny > 32} {
        incr ::screen_cmd_count
        if {$::screen_cmd_count <= 80} { logline [format "SCRCMD_%03d sx=%03d sy=%03d dx=%03d dy=%03d nx=%03d ny=%03d col=%02X cmd=%02X PC=%04X" $::screen_cmd_count $sx $sy $dx $dy $nx $ny $col $cmd [reg PC]] }
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
foreach a {0x6000 0x8000 0xA000} {
    debug set_watchpoint write_mem $a {} {
        if {$::active} {
            incr ::map_count
            if {$::map_count <= 160} { logline [format "MAP_%03d %04X=%02X PC=%04X" $::map_count $::wp_last_address $::wp_last_value [reg PC]] }
        }
        debug cont
    }
}
debug set_watchpoint write_mem {0xC000 0xC0BF} {} {
    if {$::active} {
        incr ::c0_count
        if {$::c0_count <= 220} { logline [format "C0W_%03d %04X=%02X PC=%04X IX=%04X HL=%04X" $::c0_count $::wp_last_address $::wp_last_value [reg PC] [reg IX] [reg HL]] }
    }
    debug cont
}

logline "RUN focused door transition"
after time 9.0 { kd 8 1 "SPACE1" }
after time 9.2 { ku 8 1 "SPACE1" }
after time 12.0 { kd 8 1 "SPACE2" }
after time 12.2 { ku 8 1 "SPACE2" }
after time 22.0 { shot "doorfocus_22_start.png" "T22_START"; vars "T22_START"; kd 8 128 "RIGHT_LONG" }
after time 31.0 { set ::active 1; shot "doorfocus_31_before_door.png" "T31_BEFORE"; vars "T31_BEFORE"; dump_bytes_to_file "memory" 0xC000 0x1000 "doorfocus_31_ram_c000_cfff.bin" }
after time 35.0 { shot "doorfocus_35_in_door.png" "T35_IN_DOOR"; vars "T35_IN_DOOR" }
after time 39.0 { shot "doorfocus_39_inside.png" "T39_INSIDE"; vars "T39_INSIDE"; dump_bytes_to_file "memory" 0xC000 0x1000 "doorfocus_39_ram_c000_cfff.bin"; dump_bytes_to_file "physical VRAM" 0x0000 0x2000 "doorfocus_39_vram_top.bin" }
after time 40.0 { ku 8 128 "RIGHT_LONG"; logline [format "COUNTS hud=%d screen=%d c0=%d map=%d" $::hud_cmd_count $::screen_cmd_count $::c0_count $::map_count]; close $::f; exit }
