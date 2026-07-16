set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-slime/slime_vram_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc vpeek {addr} { return [debug read "VRAM" $addr] }
proc mem8 {addr} { return [debug read memory $addr] }
proc dumpv {tag base count} {
    set s ""
    for {set i 0} {$i < $count} {incr i} {
        append s [format " %02X" [vpeek [expr {$base + $i}]]]
    }
    logline [format "%s base=%05X:%s" $tag $base $s]
}

after time 6  { keymatrixdown 8 0x01 }
after time 7  { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 9  { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 11 { keymatrixup 8 0x01 }

after time 14 {
    logline [format "slime x=%02X y=%02X phase=%02X count=%02X" [mem8 0xC12B] [mem8 0xC12C] [mem8 0xC142] [mem8 0xC12A]]
    dumpv "sat_player_F600" 0xF600 16
    dumpv "sat_enemy_F610" 0xF610 16
    dumpv "sat_turret_F620" 0xF620 16
    dumpv "col_enemy0" [expr {0xF400 + 0x40}] 16
    dumpv "col_enemy1" [expr {0xF400 + 0x50}] 16
    dumpv "pat_grp33_FC20" 0xFC20 32
    dumpv "pat_grp41_FD20" 0xFD20 32
    logline [format "vdp_r8=%02X" [debug read "VDP regs" 8]]
    catch {screenshot -raw C:/Users/salam/Documents/Programacion/Mideas/test/msx2-slime/slime_probe.png} err
    logline "shot=$err"
    close $f
    exit
}
