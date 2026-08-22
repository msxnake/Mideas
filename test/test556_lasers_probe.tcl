set rom_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test556_lasers.rom"
set log_path "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/openmsx-probe.log"
set f [open $log_path "w"]

proc m8 {addr} { return [expr {[debug read memory $addr] & 255}] }
proc state {tag} {
    global f
    puts $f [format "%s pc=%04X screen=%02X slot=%02X active=%02X/%02X pos=%02X/%02X,%02X/%02X mask=%02X n/e/s/w=%02X/%02X/%02X/%02X cd=%02X path=%02X fire=%02X/%02X" \
        $tag [reg PC] [m8 0xC00B] [m8 0xD03E] [m8 0xD00A] [m8 0xD059] \
        [m8 0xD00B] [m8 0xD00C] [m8 0xD05A] [m8 0xD05B] \
        [m8 0xD036] [m8 0xD037] [m8 0xD038] [m8 0xD039] [m8 0xD03A] \
        [m8 0xD03B] [m8 0xD02D] [m8 0xD02E] [m8 0xD065] [m8 0xD067]]
    flush $f
}
proc path_fire_bp {} {
    global f
    puts $f [format "PATH_FIRE slot=%02X pos=%02X/%02X mask=%02X path=%02X" \
        [m8 0xD03E] [m8 0xD00B] [m8 0xD00C] [m8 0xD036] [m8 0xD02D]]
    flush $f
    debug cont
}
proc laser_start_bp {} {
    global f
    set slot [m8 0xD03E]
    puts $f [format "LASER_START slot=%02X pos=%02X/%02X mask=%02X n/e/s/w=%02X/%02X/%02X/%02X" \
        [m8 0xD03E] [m8 0xD00B] [m8 0xD00C] [m8 0xD036] \
        [m8 0xD037] [m8 0xD038] [m8 0xD039] [m8 0xD03A]]
    if {$slot == 0} {
        screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-start-alpha.png"
        after time 0.015 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-alpha-15ms.png" }
        after time 0.030 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-alpha-30ms.png" }
        after time 0.050 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-alpha-50ms.png" }
    } else {
        screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-start-beta.png"
        after time 0.015 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-beta-15ms.png" }
        after time 0.030 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-beta-30ms.png" }
        after time 0.050 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-beta-50ms.png" }
    }
    flush $f
    debug cont
}
set alpha_launch_seen 0
proc alpha_launch_bp {} {
    global f alpha_launch_seen
    set slot [m8 0xD03E]
    set sx [m8 0xD017]
    set sy [m8 0xD019]
    if {$slot == 0 && !$alpha_launch_seen && $sx == 0x80 && $sy == 0x00} {
        set alpha_launch_seen 1
        puts $f [format "LASER_LAUNCH_ALPHA slot=%02X src=%02X%02X/%02X%02X dst=%02X%02X/%02X%02X size=%02X%02X/%02X%02X" \
            $slot [m8 0xD018] $sx [m8 0xD01A] $sy [m8 0xD01C] [m8 0xD01B] \
            [m8 0xD01E] [m8 0xD01D] [m8 0xD020] [m8 0xD01F] \
            [m8 0xD022] [m8 0xD021]]
        screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-launch-alpha.png"
        after time 0.015 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-launch-alpha-15ms.png" }
        after time 0.030 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-launch-alpha-30ms.png" }
        after time 0.050 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-launch-alpha-50ms.png" }
        flush $f
    }
    debug cont
}
proc laser_frame {path} {
    screenshot $path
}

debug set_bp 0x63C0 {} { path_fire_bp }
debug set_bp 0x5BBD {} { laser_start_bp }
debug set_bp 0x6079 {} { alpha_launch_bp }
after time 4.8 { state "t4.8" }
after time 5.2 { state "t5.2"; screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/openmsx-5.2s.png" }
after time 6.0 { state "t6.0"; screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/openmsx-6.0s.png" }
after time 7.0 { state "t7.0"; screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/openmsx-7.0s.png" }
after time 8.0 { state "t8.0"; screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/openmsx-8.0s.png" }
after time 10.0 { state "t10.0"; close $f; exit }
