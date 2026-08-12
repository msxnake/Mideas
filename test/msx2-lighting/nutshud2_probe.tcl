set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/nutshud2_log.txt" w]
proc dump {tag} {
    global log
    puts $log "$tag nuts=[debug read memory 0xD00C]"
    flush $log
}
after time 4.5 { dump start ; screenshot -prefix nutshud2_0_ }
after time 5 { keymatrixdown 8 0x80 }
after time 6 { keymatrixup 8 0x80 }
after time 6.5 { dump after_walk ; screenshot -prefix nutshud2_3_ }
after time 7.0 { keymatrixdown 4 0x08 }
after time 7.3 { keymatrixup 4 0x08 }
after time 7.8 { keymatrixdown 4 0x08 }
after time 8.1 { keymatrixup 4 0x08 }
after time 8.8 { dump after_two_shots ; screenshot -prefix nutshud2_1_ ; close $log ; exit }
