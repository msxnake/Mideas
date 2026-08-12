set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/t263lit_log.txt" w]
proc dump {tag} {
    global log
    puts $log "$tag cola=[debug read memory 0xD05F] nueces=[debug read memory 0xD00C] farol=(on [debug read memory 0xD07F] x [debug read memory 0xD080] y [debug read memory 0xD081]) bala=(act [debug read memory 0xC0DA] x [debug read memory 0xC0DB] y [debug read memory 0xC0DC])"
    flush $log
}
# recoger munición andando a la derecha
after time 9.5 { keymatrixdown 8 0x80 }
after time 11.0 { keymatrixup 8 0x80 ; dump con_municion ; screenshot -prefix t263lit_0_antes_ }
# disparar: la bala debe llevar farol
after time 11.6 { keymatrixdown 4 0x08 }
after time 11.68 { dump disparo+80ms ; screenshot -prefix t263lit_1_vuelo_ }
after time 11.75 { dump disparo+150ms ; screenshot -prefix t263lit_2_vuelo_ }
after time 11.9 { keymatrixup 4 0x08 ; dump disparo+300ms }
after time 12.6 { dump tras_morir ; screenshot -prefix t263lit_3_despues_ }
after time 13.2 { close $log ; exit }
