set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/ride_log.txt" w]
proc watch {} {
    global log
    puts $log "room=[debug read memory 0xC00B] slot=[debug read memory 0xC0E7] cy=[debug read memory 0xC0E8] rider=[debug read memory 0xC0EA] hand=[debug read memory 0xC0EC] py=[debug read memory 0xC000] comp=[debug read memory 0xC0D1] pend=[debug read memory 0xC0D2] dir=[debug read memory 0xC0D3] blk=[debug read memory 0xC0D6] forced=[debug read memory 0xC0EB]"
    flush $log
    after frame watch
}
after time 3.0 { watch }
after time 7.0 { close $log; exit }
