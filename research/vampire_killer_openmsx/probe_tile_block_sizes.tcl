set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_tile_block_sizes.log" "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc shot {name} { global out_dir; screenshot "$out_dir/$name"; logline "SHOT $name" }
proc kd {row mask label} { keymatrixdown $row $mask; logline "KD row=$row mask=$mask $label" }
proc ku {row mask label} { keymatrixup $row $mask; logline "KU row=$row mask=$mask $label" }

set ::active 0
set ::phase 0
set ::first 0
set ::r17 -1
array set ::cmdregs {}
array set ::size_counts {}
array set ::sample_counts {}
set ::total_cmds 0
set ::screen_cmds 0
set ::hud_cmds 0
set ::large_cmds 0

proc getreg {n} { if {[info exists ::cmdregs($n)]} { return $::cmdregs($n) }; return 0 }
proc note_cmd {} {
    set sx [expr {[getreg 32] | ([getreg 33] << 8)}]
    set sy [expr {[getreg 34] | ([getreg 35] << 8)}]
    set dx [expr {[getreg 36] | ([getreg 37] << 8)}]
    set dy [expr {[getreg 38] | ([getreg 39] << 8)}]
    set nx [expr {[getreg 40] | ([getreg 41] << 8)}]
    set ny [expr {[getreg 42] | ([getreg 43] << 8)}]
    set col [getreg 44]
    set cmd [getreg 46]
    set pc [reg PC]

    if {$nx <= 0 || $ny <= 0 || $nx > 512 || $ny > 512} {
        return
    }

    incr ::total_cmds
    if {$dy < 32} {
        set area HUD
        incr ::hud_cmds
    } elseif {$dy < 212 || $ny > 32} {
        set area SCREEN
        incr ::screen_cmds
    } else {
        set area OFFSCREEN
    }
    if {$nx > 16 || $ny > 16} { incr ::large_cmds }

    set key [format "%s nx=%03d ny=%03d cmd=%02X pc=%04X" $area $nx $ny $cmd $pc]
    if {![info exists ::size_counts($key)]} { set ::size_counts($key) 0 }
    incr ::size_counts($key)

    set sample_key $key
    if {![info exists ::sample_counts($sample_key)]} { set ::sample_counts($sample_key) 0 }
    if {$::sample_counts($sample_key) < 4} {
        incr ::sample_counts($sample_key)
        logline [format "SAMPLE %s sx=%03d sy=%03d dx=%03d dy=%03d nx=%03d ny=%03d col=%02X cmd=%02X pc=%04X" $area $sx $sy $dx $dy $nx $ny $col $cmd $pc]
    }
}

proc dump_summary {tag} {
    logline [format "SUMMARY %s total=%d screen=%d hud=%d large=%d" $tag $::total_cmds $::screen_cmds $::hud_cmds $::large_cmds]
    foreach key [lsort [array names ::size_counts]] {
        logline [format "COUNT %04d %s" $::size_counts($key) $key]
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
            if {($v & 0x80) != 0 && (($v & 0x3f) == 17)} {
                set ::r17 [expr {$first & 0x3f}]
            }
        }
    }
    debug cont
}

debug set_watchpoint write_io 0x9B {} {
    if {$::active && $::r17 >= 0} {
        set ::cmdregs($::r17) $::wp_last_value
        if {$::r17 == 46} { note_cmd }
        incr ::r17
    }
    debug cont
}

logline "RUN tile/block command-size probe"
after time 9.0 { kd 8 1 "SPACE1" }
after time 9.2 { ku 8 1 "SPACE1" }
after time 12.0 { kd 8 1 "SPACE2" }
after time 12.2 { ku 8 1 "SPACE2" }
after time 17.0 { set ::active 1; logline "ACTIVE gameplay/room commands"; shot "tileprobe_17_gameplay.png" }
after time 22.0 { shot "tileprobe_22_initial_room.png"; kd 8 128 "RIGHT_LONG" }
after time 31.0 { shot "tileprobe_31_before_door.png" }
after time 39.0 { shot "tileprobe_39_inside.png" }
after time 40.0 { ku 8 128 "RIGHT_LONG"; dump_summary "initial_and_door"; close $::f; exit }
