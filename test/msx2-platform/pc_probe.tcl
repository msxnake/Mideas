set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/pc_log.txt" w]
proc watch {} {
    global log
    puts $log "pc=[format %04X [reg pc]] comp=[debug read memory 0xC0D1] blk=[debug read memory 0xC0D6]"
    flush $log
    after frame watch
}
after time 3.0 { watch }
after time 6.5 { close $log; exit }
