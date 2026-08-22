set rom_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test556_lasers.rom"
set log_path "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/openmsx-beta-probe.log"
set f [open $log_path "w"]

proc m8 {addr} { return [expr {[debug read memory $addr] & 255}] }
proc laser_start_bp {} {
    global f
    set slot [m8 0xD03E]
    puts $f [format "LASER_START slot=%02X pos=%02X/%02X mask=%02X n/e/s/w=%02X/%02X/%02X/%02X" \
        $slot [m8 0xD00B] [m8 0xD00C] [m8 0xD036] \
        [m8 0xD037] [m8 0xD038] [m8 0xD039] [m8 0xD03A]]
    if {$slot == 1} {
        screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-start-beta.png"
        after time 0.015 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-beta-15ms.png" }
        after time 0.030 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-beta-30ms.png" }
        after time 0.050 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-beta-50ms.png" }
    }
    flush $f
    debug cont
}

set beta_launch_seen 0
proc laser_launch_bp {} {
    global f beta_launch_seen
    set slot [m8 0xD03E]
    set sx [m8 0xD017]
    set sy [m8 0xD019]
    if {$slot == 1 && !$beta_launch_seen && $sx == 0x90 && $sy == 0x00} {
        set beta_launch_seen 1
        puts $f [format "LASER_LAUNCH slot=%02X src=%02X%02X/%02X%02X dst=%02X%02X/%02X%02X size=%02X%02X/%02X%02X" \
            $slot [m8 0xD018] $sx [m8 0xD01A] $sy [m8 0xD01C] [m8 0xD01B] \
            [m8 0xD01E] [m8 0xD01D] [m8 0xD020] [m8 0xD01F] \
            [m8 0xD022] [m8 0xD021]]
        screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-launch-beta.png"
        after time 0.015 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-launch-beta-15ms.png" }
        after time 0.030 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-launch-beta-30ms.png" }
        after time 0.050 { screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-lasers/laser-launch-beta-50ms.png" }
        flush $f
    }
    debug cont
}

debug set_bp 0x5BBD {} { laser_start_bp }
debug set_bp 0x6079 {} { laser_launch_bp }
after time 12.0 { close $f; exit }
