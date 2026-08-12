set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/t263lit_log2.txt" w]
proc dump {tag} {
    global log
    puts $log "$tag cola=[debug read memory 0xD05F] nueces=[debug read memory 0xD00C] farol=(on [debug read memory 0xD07F] x [debug read memory 0xD080] y [debug read memory 0xD081]) bala=(act [debug read memory 0xC0DA] x [debug read memory 0xC0DB] y [debug read memory 0xC0DC] dir [debug read memory 0xC0DD])"
    flush $log
}
after time 9.5 { keymatrixdown 8 0x80 }
after time 11.0 { keymatrixup 8 0x80 ; dump con_municion }
# ARRIBA mantenido + fuego
after time 11.5 { keymatrixdown 8 0x20 }
after time 11.7 { keymatrixdown 4 0x08 }
after time 11.75 { dump t+50ms ; screenshot -prefix t263lit_a_ }
after time 11.80 { dump t+100ms ; screenshot -prefix t263lit_b_ }
after time 11.85 { keymatrixup 4 0x08 ; dump t+150ms }
after time 11.95 { dump t+250ms ; screenshot -prefix t263lit_c_ }
after time 12.15 { dump t+450ms }
after time 12.5 { keymatrixup 8 0x20 ; dump tras_morir ; screenshot -prefix t263lit_d_ }
after time 13.0 { close $log ; exit }
