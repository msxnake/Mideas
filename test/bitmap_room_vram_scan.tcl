set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/bitmap_room_vram_scan.txt"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc vpeek {addr} { return [debug read VRAM $addr] }

proc dumpv {tag base count} {
    set s ""
    for {set i 0} {$i < $count} {incr i} {
        append s [format " %02X" [vpeek [expr {$base + $i}]]]
    }
    logline [format "%s base=%05X:%s" $tag $base $s]
}

after time 14 {
    foreach base {0x0000 0x2000 0x4000 0x6000 0x8000 0xA000 0xC000 0xE000 0xF400 0xF600 0xF800} {
        dumpv "scan" $base 32
    }
    close $f
    exit
}
