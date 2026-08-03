set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/r15_log.txt" w]
proc dump {tag} {
    global log
    puts $log "$tag R#15=[format %02X [debug read {VDP regs} 15]] R#14=[format %02X [debug read {VDP regs} 14]] comp=[debug read memory 0xC0D1] blk=[debug read memory 0xC0D6] slot=[debug read memory 0xC0E7]"
    flush $log
}
after time 4.0 { dump "antes:  " }
after time 5.5 { dump "durante:" }
after time 6.2 { dump "colgado:" }
after time 6.5 { close $log; exit }
