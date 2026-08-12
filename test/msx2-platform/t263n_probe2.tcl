set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/t263n_log2.txt" w]
proc dump {tag} {
    global log
    puts $log "$tag nueces=[debug read memory 0xD00C] hud_drawn=[debug read memory 0xD000] player=([debug read memory 0xC001],[debug read memory 0xC000])"
    flush $log
}
after time 7 { dump inicio }
after time 9.5 { keymatrixdown 8 0x80 }
after time 11.0 { keymatrixup 8 0x80 ; dump tras_andar }
after time 11.5 { dump t11_5 ; screenshot -prefix t263n_b_ }
after time 12.2 { close $log ; exit }
