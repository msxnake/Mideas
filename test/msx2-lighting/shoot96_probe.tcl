set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/shoot96_log.txt" w]
proc dump {tag} {
    global log
    puts $log "$tag nuts=[debug read memory 0xD00C] slot0=(act [debug read memory 0xC0DA] x [debug read memory 0xC0DB] y [debug read memory 0xC0DC] dir [debug read memory 0xC0DD] life [debug read memory 0xC0DE]) player=([debug read memory 0xC001],[debug read memory 0xC000])"
    flush $log
}
# recoger munición
after time 5 { keymatrixdown 8 0x80 }
after time 6 { keymatrixup 8 0x80 ; dump ammo }

# A) disparo horizontal: debe morir a los 96 px
after time 6.5 { keymatrixdown 4 0x08 }
after time 6.55 { dump h+50ms }
after time 6.7 { keymatrixup 4 0x08 ; dump h+200ms }
after time 6.9 { dump h+400ms }
after time 7.1 { dump h+600ms }
after time 7.3 { dump h+800ms }

# B) ARRIBA mantenido + fuego: debe salir hacia arriba (dir 2)
after time 8.0 { keymatrixdown 8 0x20 }
after time 8.2 { keymatrixdown 4 0x08 }
after time 8.25 { dump up+50ms }
after time 8.35 { dump up+150ms }
after time 8.45 { keymatrixup 4 0x08 ; dump up+250ms }
after time 8.6 { keymatrixup 8 0x20 ; dump up+400ms }
after time 9.2 { dump end ; screenshot -prefix shoot96_ ; close $log ; exit }
