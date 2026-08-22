set rom_path "C:/Users/salam/Downloads/test556_dualboss.rom"
set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test556_dualboss_probe.log"
carta $rom_path
set f [open $log_path "w"]

proc m8 {addr} { return [expr {[debug read memory $addr] & 255}] }
proc state {tag} {
    global f
    set pc [reg PC]
    set screen [m8 0xC00B]
    set pool [m8 0xC1FC]
    set active [m8 0xD00A]
    set slot [m8 0xD03E]
    set defeated0 [m8 0xD026]
    set defeated1 [m8 0xD027]
    set bx [m8 0xD00B]
    set by [m8 0xD00C]
    set laser [m8 0xD036]
    set lasercd [m8 0xD03B]
    set path [m8 0xD02D]
    set pathwait [m8 0xD02C]
    set pathfire [m8 0xD02E]
    set intro [m8 0xD02F]
    set auto [m8 0xD034]
    set targetx [m8 0xD035]
    set playerx [m8 0xC001]
    set playery [m8 0xC000]
    set slot1active [m8 0xD059]
    set slot1x [m8 0xD05A]
    set slot1y [m8 0xD05B]
    set slot1wait [m8 0xD064]
    set slot1path [m8 0xD065]
    set slot1laser [m8 0xD067]
    set p1 [m8 0xC053]
    set p2 [m8 0xC054]
    set p3 [m8 0xC055]
    puts $f [format "%s pc=%04X screen=%02X pool=%02X slot=%02X active=%02X slot1active=%02X pos0=%02X/%02X pos1=%02X/%02X defeated=%02X/%02X intro=%02X auto=%02X target=%02X player=%02X/%02X path=%02X wait=%02X fire=%02X laser=%02X cd=%02X slot1path=%02X slot1wait=%02X slot1laser=%02X banks=%02X/%02X/%02X" $tag $pc $screen $pool $slot $active $slot1active $bx $by $slot1x $slot1y $defeated0 $defeated1 $intro $auto $targetx $playerx $playery $path $pathwait $pathfire $laser $lasercd $slot1path $slot1wait $slot1laser $p1 $p2 $p3]
    flush $f
}

after time 4.8 { state "t4.8" }
after time 5.2 { state "t5.2"; screenshot "C:/Users/salam/Downloads/test556_dualboss_probe_52.png" }
after time 5.6 { state "t5.6" }
after time 6.0 { state "t6.0"; screenshot "C:/Users/salam/Downloads/test556_dualboss_probe_60.png" }
after time 6.08 { state "t6.08"; screenshot "C:/Users/salam/Downloads/test556_dualboss_laser_608.png" }
after time 6.12 { state "t6.12"; screenshot "C:/Users/salam/Downloads/test556_dualboss_laser_612.png" }
after time 6.16 { state "t6.16"; screenshot "C:/Users/salam/Downloads/test556_dualboss_laser_616.png" }
after time 6.20 { state "t6.20"; screenshot "C:/Users/salam/Downloads/test556_dualboss_laser_620.png" }
after time 7.0 { state "t7.0" }
after time 8.0 { state "t8.0"; screenshot "C:/Users/salam/Downloads/test556_dualboss_probe_80.png" }
after time 8.03 { state "t8.03"; screenshot "C:/Users/salam/Downloads/test556_dualboss_beta_laser_803.png" }
after time 8.05 { state "t8.05"; screenshot "C:/Users/salam/Downloads/test556_dualboss_beta_laser_805.png" }
after time 8.07 { state "t8.07"; screenshot "C:/Users/salam/Downloads/test556_dualboss_beta_laser_807.png" }
after time 8.09 { state "t8.09"; screenshot "C:/Users/salam/Downloads/test556_dualboss_beta_laser_809.png" }
after time 8.12 { state "t8.12"; screenshot "C:/Users/salam/Downloads/test556_dualboss_beta_laser_812.png" }
after time 8.20 { state "t8.20"; screenshot "C:/Users/salam/Downloads/test556_dualboss_beta_laser_820.png" }
after time 8.30 { state "t8.30" }
after time 9.0 { state "t9.0" }
after time 10.0 { state "t10.0"; close $f; exit }
