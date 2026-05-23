set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_title_game.log" "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc state {tag} {
    logline [format "%s PC=%04X SP=%04X AF=%04X BC=%04X DE=%04X HL=%04X" $tag [reg PC] [reg SP] [reg AF] [reg BC] [reg DE] [reg HL]]
}

proc shot {name tag} {
    global out_dir
    state $tag
    screenshot "$out_dir/$name"
    logline "SHOT $name"
}

proc dump_debug_bytes {space start len label} {
    set parts {}
    for {set i 0} {$i < $len} {incr i} {
        set addr [expr {$start + $i}]
        if {[catch {debug read $space $addr} v]} {
            lappend parts "ERR"
        } else {
            lappend parts [format "%02X" $v]
        }
    }
    logline [format "%s %s:%04X len=%d %s" $label $space $start $len [join $parts " "]]
}

proc dump_vdp_regs {label} {
    set parts {}
    for {set i 0} {$i < 32} {incr i} {
        if {[catch {debug read "VDP regs" $i} v]} {
            lappend parts "ERR"
        } else {
            lappend parts [format "R%02d=%02X" $i $v]
        }
    }
    logline "$label [join $parts " "]"
}

set ::map_count 0
debug set_watchpoint write_mem 0x6000 {} {
    incr ::map_count
    if {$::map_count <= 80} { state [format "MAP6000_%03d_VAL_%02X" $::map_count $::wp_last_value] }
    debug cont
}
debug set_watchpoint write_mem 0x8000 {} {
    incr ::map_count
    if {$::map_count <= 80} { state [format "MAP8000_%03d_VAL_%02X" $::map_count $::wp_last_value] }
    debug cont
}
debug set_watchpoint write_mem 0xA000 {} {
    incr ::map_count
    if {$::map_count <= 80} { state [format "MAPA000_%03d_VAL_%02X" $::map_count $::wp_last_value] }
    debug cont
}

after time 10.0 {
    shot "title_10s.png" "TITLE_10S"
    dump_vdp_regs "VDPREG_TITLE"
    dump_debug_bytes "VRAM" 0x0000 64 "VRAM_TITLE_0000"
    dump_debug_bytes "VRAM" 0x1800 64 "VRAM_TITLE_1800"
    dump_debug_bytes "VRAM" 0x1B00 64 "VRAM_TITLE_1B00"
    dump_debug_bytes "VRAM" 0x3800 64 "VRAM_TITLE_3800"
}

after time 10.5 { keymatrixdown 8 1; logline "INPUT SPACE TITLE DOWN" }
after time 10.7 { keymatrixup 8 1; logline "INPUT SPACE TITLE UP" }

after time 14.0 { shot "after_space_14s.png" "AFTER_SPACE_14S"; dump_vdp_regs "VDPREG_14S" }
after time 18.0 { shot "after_space_18s.png" "AFTER_SPACE_18S"; dump_vdp_regs "VDPREG_18S" }
after time 22.0 { shot "after_space_22s.png" "AFTER_SPACE_22S"; dump_vdp_regs "VDPREG_22S" }

after time 22.2 {
    dump_debug_bytes "memory" 0xC000 128 "RAM_C000"
    dump_debug_bytes "memory" 0xE000 128 "RAM_E000"
    dump_debug_bytes "VRAM" 0x0000 64 "VRAM_22_0000"
    dump_debug_bytes "VRAM" 0x1800 64 "VRAM_22_1800"
    dump_debug_bytes "VRAM" 0x2000 64 "VRAM_22_2000"
    dump_debug_bytes "VRAM" 0x3800 64 "VRAM_22_3800"
    logline [format "COUNTS mapper=%d" $::map_count]
    close $::f
    exit
}
