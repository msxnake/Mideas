set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/rom_probe_log.txt" w]
after time 6 {
    global log
    set line "cpu@ACD2: "
    for {set i 0} {$i < 24} {incr i} { append line "[format %02X [debug read memory [expr {0xACD2 + $i}]]] " }
    puts $log $line
    set line "cpu@ACEA: "
    for {set i 0} {$i < 4} {incr i} { append line "[format %02X [debug read memory [expr {0xACEA + $i}]]] " }
    puts $log $line
    close $log
    exit
}
