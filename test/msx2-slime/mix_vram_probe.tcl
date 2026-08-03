set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-slime/mix_vram_probe.txt"
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
    logline [format "enemy_count=%02X" [mem8 0xC12A]]
    dumpv "FC00" 0xFC00 64
    dumpv "FE00" 0xFE00 64
    dumpv "FE40" 0xFE40 64
    dumpv "FE80" 0xFE80 64
    dumpv "FEC0" 0xFEC0 64
    close $f
    exit
}
