set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/t263n_log.txt" w]
proc dump {tag} {
    global log
    puts $log "$tag sala=[debug read memory 0xC00B] nueces=[debug read memory 0xD00C] player=([debug read memory 0xC001],[debug read memory 0xC000]) bala=[debug read memory 0xC0DA]"
    flush $log
}
# el GameFlow arranca con musica + WorldLink; damos margen
after time 6 { dump arranque }
after time 8 { dump t8 ; screenshot -prefix t263n_0_inicio_ }
# disparar sin munición: no debe salir bala
after time 8.5 { keymatrixdown 4 0x08 }
after time 8.8 { keymatrixup 4 0x08 ; dump disparo_sin_municion }
# andar a la derecha sobre las dos nueces del suelo
after time 9.5 { keymatrixdown 8 0x80 }
after time 11.0 { keymatrixup 8 0x80 ; dump tras_andar ; screenshot -prefix t263n_1_recogidas_ }
# ahora sí debe disparar y gastar
after time 11.6 { keymatrixdown 4 0x08 }
after time 11.68 { dump disparo1 }
after time 11.8 { keymatrixup 4 0x08 }
after time 12.4 { keymatrixdown 4 0x08 }
after time 12.6 { keymatrixup 4 0x08 ; dump disparo2 }
after time 13.2 { dump final ; screenshot -prefix t263n_2_final_ ; close $log ; exit }
