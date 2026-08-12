set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/shoot96b_log.txt" w]
proc dump {tag} {
    global log
    puts $log "$tag slot0=(act [debug read memory 0xC0DA] x [debug read memory 0xC0DB] dir [debug read memory 0xC0DD] life [debug read memory 0xC0DE]) player=([debug read memory 0xC001],[debug read memory 0xC000])"
    flush $log
}
after time 5 { keymatrixdown 8 0x80 }
after time 6 { keymatrixup 8 0x80 }
after time 6.3 { keymatrixdown 8 0x10 }
after time 6.5 { keymatrixup 8 0x10 ; dump facing_left }
after time 7.0 { keymatrixdown 4 0x08 }
after time 7.05 { dump l+50ms }
after time 7.2 { keymatrixup 4 0x08 ; dump l+200ms }
after time 7.5 { dump l+500ms }
after time 7.7 { dump l+700ms }
after time 8.0 { dump l+1000ms ; close $log ; exit }
