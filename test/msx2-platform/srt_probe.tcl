set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/srt_log.txt" w]
set n 0
debug set_bp 0x4384 {} { incr ::n }
proc dump {tag} {
    global log
    puts $log "$tag start_room_transition llamado $::n veces | comp=[debug read memory 0xC0D1] blk=[debug read memory 0xC0D6] penddir=[debug read memory 0xC0ED] slot=[debug read memory 0xC0E7] rider=[debug read memory 0xC0EA]"
    flush $log
    set ::n 0
}
after time 4.5 { dump "antes:  " }
after time 6.5 { dump "despues:" }
after time 7.0 { close $log; exit }
