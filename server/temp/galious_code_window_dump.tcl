set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_code_window_dump.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }

proc dump_bytes {label start len} {
    logline [format "%s start=%04X len=%04X" $label $start $len]
    for {set off 0} {$off < $len} {incr off 16} {
        set line [format "%04X:" [expr {$start + $off}]]
        for {set i 0} {$i < 16 && ($off + $i) < $len} {incr i} {
            append line [format " %02X" [mem8 [expr {$start + $off + $i}]]]
        }
        logline $line
    }
}

proc dump_at_story {} {
    dump_bytes "around_5B80" 0x5B80 0xC0
    dump_bytes "around_6AC0" 0x6AC0 0x80
    dump_bytes "ram_E800" 0xE800 0x260
    dump_bytes "ram_ED00" 0xED00 0x100
    logline "DONE"
    close $::f
    exit
}

after time 76.0 { dump_at_story }
