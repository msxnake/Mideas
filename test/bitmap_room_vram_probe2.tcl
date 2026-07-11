set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/bitmap_room_vram_probe2.txt"
set shot_path "C:/Users/salam/Documents/Programacion/Mideas/test/bitmap_room_vram_probe2.png"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc vpeek {addr} { return [debug read VRAM $addr] }

proc dumpv {tag base count} {
    set s ""
    for {set i 0} {$i < $count} {incr i} {
        append s [format " %02X" [vpeek [expr {$base + $i}]]]
    }
    logline [format "%s base=%05X:%s" $tag $base $s]
}

after time 14 {
    logline [format "pc=%04X sp=%04X x=%02X y=%02X" [reg PC] [reg SP] [mem8 0xC001] [mem8 0xC000]]
    dumpv "visible_0000" 0x0000 32
    dumpv "visible_1000" 0x1000 32
    dumpv "visible_2000" 0x2000 32
    dumpv "atlas_A000" 0xA000 32
    dumpv "sat_F600" 0xF600 16
    if {[catch {screenshot $shot_path} err]} {
        logline "SHOTERR $err"
    } else {
        logline "SHOTOK $shot_path"
    }
    close $f
    exit
}
