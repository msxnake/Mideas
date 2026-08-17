set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/mush_state.txt" w]
proc dump {t} {
    global f
    puts $f [format "t=%-6s on=%d stage=%d timer=%3d halo=(%3d,%3d) player=(%3d,%3d)" $t \
        [debug read memory 0xD01E] [debug read memory 0xD01F] [debug read memory 0xD020] \
        [debug read memory 0xD00A] [debug read memory 0xD00B] \
        [debug read memory 0xC000] [debug read memory 0xC001]]
    flush $f
}
after time 9 { dump "9 dark" ; keymatrixdown 8 0x80 }
after time 13 { keymatrixup 8 0x80 ; dump "13 eat" }
after time 14 { dump 14 }
after time 15 { dump 15 }
after time 16 { dump 16 }
after time 17 { dump 17 }
after time 18 { dump 18 }
after time 19 { dump 19 }
after time 20 { dump 20 ; close $f ; exit }
