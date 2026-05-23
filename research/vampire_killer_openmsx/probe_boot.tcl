set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_boot.log" "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc safe {label script} {
    if {[catch {uplevel 1 $script} result]} {
        logline "$label ERROR $result"
    } else {
        logline "$label $result"
    }
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set af [reg AF]
    set bc [reg BC]
    set de [reg DE]
    set hl [reg HL]
    logline [format "%s PC=%04X SP=%04X AF=%04X BC=%04X DE=%04X HL=%04X" $tag $pc $sp $af $bc $de $hl]
}

proc shot {name tag} {
    global out_dir
    state $tag
    screenshot "$out_dir/$name"
    logline "SHOT $name"
}

logline "ROM Vampire Killer SHA1 5EF7D03B138A2023F6DEF241B671C666F97ED83B"
safe "MACHINE" {machine_info config_name}
safe "EXTENSIONS" {ext}
safe "DEBUG_LIST" {debug list}

set ::vdp_count 0
set ::vdp_data_count 0
set ::psg_count 0
set ::map_count 0

debug set_watchpoint write_io 0x99 {} {
    incr ::vdp_count
    if {$::vdp_count <= 120} {
        state [format "VDP_CTRL_%03d_VAL_%02X" $::vdp_count $::wp_last_value]
    }
    debug cont
}

debug set_watchpoint write_io 0x98 {} {
    incr ::vdp_data_count
    if {$::vdp_data_count <= 80} {
        state [format "VDP_DATA_%03d_VAL_%02X" $::vdp_data_count $::wp_last_value]
    }
    debug cont
}

debug set_watchpoint write_io 0xA0 {} {
    incr ::psg_count
    if {$::psg_count <= 80} {
        state [format "PSG_IDX_%03d_VAL_%02X" $::psg_count $::wp_last_value]
    }
    debug cont
}

debug set_watchpoint write_io 0xA1 {} {
    incr ::psg_count
    if {$::psg_count <= 80} {
        state [format "PSG_DAT_%03d_VAL_%02X" $::psg_count $::wp_last_value]
    }
    debug cont
}

foreach addr {0x5000 0x6000 0x7000 0x8000 0x9000 0xA000 0xB000} {
    debug set_watchpoint write_mem $addr {} {
        incr ::map_count
        if {$::map_count <= 80} {
            state [format "MAP_WRITE_%03d_ADDR_%04X_VAL_%02X" $::map_count $::wp_last_address $::wp_last_value]
        }
        debug cont
    }
}

after time 2.0 { shot "boot_02s.png" "SHOT_02S" }
after time 4.0 { keymatrixdown 8 1; logline "INPUT SPACE DOWN" }
after time 4.2 { keymatrixup 8 1; logline "INPUT SPACE UP" }
after time 6.0 { shot "boot_06s.png" "SHOT_06S" }
after time 8.0 { keymatrixdown 8 1; logline "INPUT SPACE2 DOWN" }
after time 8.2 { keymatrixup 8 1; logline "INPUT SPACE2 UP" }
after time 10.0 { shot "boot_10s.png" "SHOT_10S" }
after time 12.0 {
    logline [format "COUNTS vdp_ctrl=%d vdp_data=%d psg=%d mapper=%d" $::vdp_count $::vdp_data_count $::psg_count $::map_count]
    close $::f
    exit
}
