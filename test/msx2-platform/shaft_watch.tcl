set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/shaft_watch_log.txt"
set log [open $logpath w]
set seen [dict create]
proc note {addr} {
    global log seen
    set pc [format "%04X" [reg pc]]
    set key "$addr:$pc"
    if {![dict exists $seen $key]} {
        dict set seen $key 1
        puts $log "write [format %04X $addr] from PC=$pc"
        flush $log
    }
}
debug set_watchpoint write_mem 0xC0E7 {} {note 0xC0E7}
debug set_watchpoint write_mem 0xC0EA {} {note 0xC0EA}
after time 8 {
    close $log
    exit
}
