set rom_path "C:/Users/salam/Downloads/test556_dualboss.rom"
set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test556_dualboss_break.log"
carta $rom_path
set f [open $log_path "w"]

proc m8 {addr} { return [expr {[debug read memory $addr] & 255}] }
proc path_fire_bp {} {
    global f
    puts $f [format "PATH_FIRE slot=%02X pos=%02X/%02X path=%02X wait=%02X mask=%02X cur=%02X%02X" \
        [m8 0xD03E] [m8 0xD00B] [m8 0xD00C] [m8 0xD02D] [m8 0xD02C] \
        [m8 0xD036] [m8 0xD02B] [m8 0xD02A]]
    flush $f
    debug cont
}
proc laser_start_bp {} {
    global f
    puts $f [format "LASER_START slot=%02X pos=%02X/%02X path=%02X wait=%02X mask=%02X" \
        [m8 0xD03E] [m8 0xD00B] [m8 0xD00C] [m8 0xD02D] [m8 0xD02C] [m8 0xD036]]
    flush $f
    debug cont
}
proc path_after_laser_bp {} {
    global f
    puts $f [format "PATH_AFTER slot=%02X path=%02X wait=%02X mask=%02X n/e/s/w=%02X/%02X/%02X/%02X" \
        [m8 0xD03E] [m8 0xD02D] [m8 0xD02C] [m8 0xD036] \
        [m8 0xD037] [m8 0xD038] [m8 0xD039] [m8 0xD03A]]
    if {[m8 0xD03E] == 1} {
        screenshot "C:/Users/salam/Downloads/test556_dualboss_beta_fire_start.png"
        after time 0.015 { screenshot "C:/Users/salam/Downloads/test556_dualboss_beta_fire_015.png" }
        after time 0.030 { screenshot "C:/Users/salam/Downloads/test556_dualboss_beta_fire_030.png" }
        after time 0.050 { screenshot "C:/Users/salam/Downloads/test556_dualboss_beta_fire_050.png" }
    }
    flush $f
    debug cont
}
proc laser_blocked_bp {} {
    global f
    puts $f [format "LASER_BLOCKED slot=%02X pos=%02X/%02X dir=%02X mask=%02X n/e/s/w=%02X/%02X/%02X/%02X" \
        [m8 0xD03E] [m8 0xD00B] [m8 0xD00C] [reg A] [m8 0xD036] \
        [m8 0xD037] [m8 0xD038] [m8 0xD039] [m8 0xD03A]]
    flush $f
    debug cont
}

debug set_bp 0x63C0 {} { path_fire_bp }
debug set_bp 0x5BBD {} { laser_start_bp }
debug set_bp 0x63C7 {} { path_after_laser_bp }
debug set_bp 0x5CE8 {} { laser_blocked_bp }
after time 9.0 { close $f; exit }
