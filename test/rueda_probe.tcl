set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/rueda_probe.txt"
set f [open $log_path "a"]
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
    logline [format "ROM=$::env(RUEDA_TAG) enemy_count=%02X turret_count_probe" [mem8 0xC12A]]
    dumpv "FE60" 0xFE60 32
    close $f
    exit
}
