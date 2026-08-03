set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/sp_log.txt" w]
proc watch {} {
    global log
    puts $log "pc=[format %04X [reg pc]] sp=[format %04X [reg sp]] slot=[debug read memory 0xC0E7] cy=[debug read memory 0xC0E8] rider=[debug read memory 0xC0EA] comp=[debug read memory 0xC0D1]"
    flush $log
    after frame watch
}
after time 3.0 { watch }
after time 6.5 { close $log; exit }
