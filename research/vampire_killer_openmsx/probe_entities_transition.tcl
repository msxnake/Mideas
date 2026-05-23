set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_entities_transition.log" "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc state {tag} {
    logline [format "%s PC=%04X SP=%04X AF=%04X BC=%04X DE=%04X HL=%04X IX=%04X IY=%04X" $tag [reg PC] [reg SP] [reg AF] [reg BC] [reg DE] [reg HL] [reg IX] [reg IY]]
}

proc shot {name tag} {
    global out_dir
    state $tag
    screenshot "$out_dir/$name"
    logline "SHOT $name"
}

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

proc dump_line {space start len label} {
    set parts {}
    for {set i 0} {$i < $len} {incr i} {
        lappend parts [format "%02X" [debug read $space [expr {$start + $i}]]]
    }
    logline [format "%s %s:%04X %s" $label $space $start [join $parts " "]]
}

set ::ram_count 0
debug set_watchpoint write_mem {0xD000 0xEFFF} {} {
    incr ::ram_count
    if {$::ram_count <= 180} {
        state [format "RAMW_%03d_ADDR_%04X_VAL_%02X" $::ram_count $::wp_last_address $::wp_last_value]
    }
    debug cont
}

set ::vdp_ctrl_count 0
debug set_watchpoint write_io 0x99 {} {
    incr ::vdp_ctrl_count
    if {$::vdp_ctrl_count <= 160} {
        state [format "VDP99_%03d_VAL_%02X" $::vdp_ctrl_count $::wp_last_value]
    }
    debug cont
}

set ::map_count 0
foreach addr {0x6000 0x8000 0xA000} {
    debug set_watchpoint write_mem $addr {} {
        incr ::map_count
        if {$::map_count <= 160} {
            state [format "MAP_%03d_ADDR_%04X_VAL_%02X" $::map_count $::wp_last_address $::wp_last_value]
        }
        debug cont
    }
}

after time 10.5 { keymatrixdown 8 1; logline "INPUT SPACE DOWN" }
after time 10.7 { keymatrixup 8 1; logline "INPUT SPACE UP" }
after time 18.0 {
    shot "game_probe_18s.png" "GAME_18S"
    dump_line "memory" 0xD000 256 "RAM_D000_18"
    dump_line "memory" 0xE000 256 "RAM_E000_18"
}
after time 22.0 {
    shot "game_probe_22s.png" "GAME_22S"
    dump_bytes_to_file "VRAM" 0x0000 0x10000 "game_22s_vram.bin"
    dump_bytes_to_file "memory" 0xC000 0x3000 "game_22s_ram_c000_efff.bin"
    dump_line "memory" 0xD000 256 "RAM_D000_22"
    dump_line "memory" 0xE000 256 "RAM_E000_22"
    logline [format "COUNTS ram=%d vdp99=%d mapper=%d" $::ram_count $::vdp_ctrl_count $::map_count]
    close $::f
    exit
}
