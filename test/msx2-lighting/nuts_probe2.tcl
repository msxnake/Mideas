set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/nuts_log2.txt" w]
proc dump {tag} {
    global log
    puts $log "$tag nuts=[debug read memory 0xD00B] slot0=(act [debug read memory 0xC0DA] x [debug read memory 0xC0DB] y [debug read memory 0xC0DC] dir [debug read memory 0xC0DD]) player=([debug read memory 0xC001],[debug read memory 0xC000])"
    flush $log
}
after time 5 { keymatrixdown 8 0x80 }
after time 6 { keymatrixup 8 0x80 ; dump after_walk }
after time 6.5 { keymatrixdown 4 0x08 }
after time 6.55 { dump fire+50ms }
after time 6.6 { dump fire+100ms }
after time 6.7 { keymatrixup 4 0x08 ; dump fire+200ms }
after time 7.5 { dump settled ; screenshot -prefix nuts_shot_ ; close $log ; exit }
