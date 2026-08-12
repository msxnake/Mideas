set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/lantern_log.txt" w]
proc dump {tag} {
    global log
    puts $log "$tag on=[debug read memory 0xD040] nuts=[debug read memory 0xD00C] bl=(on [debug read memory 0xD060] x [debug read memory 0xD061] y [debug read memory 0xD062]) bullet=(act [debug read memory 0xC0DA] x [debug read memory 0xC0DB] y [debug read memory 0xC0DC] dir [debug read memory 0xC0DD])"
    flush $log
}
after time 5 { keymatrixdown 8 0x80 }
after time 6 { keymatrixup 8 0x80 }
after time 6.5 { dump before ; screenshot -prefix lant_0_before_ }
after time 7.0 { keymatrixdown 4 0x08 }
after time 7.08 { dump fire+80ms ; screenshot -prefix lant_1_fly_ }
after time 7.2 { keymatrixup 4 0x08 ; dump fire+200ms ; screenshot -prefix lant_2_fly_ }
after time 7.4 { dump fire+400ms }
after time 8.0 { dump settled ; screenshot -prefix lant_3_after_ }
after time 8.6 { close $log ; exit }
