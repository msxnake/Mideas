set out "test/mapper-2m/smoke_k4.txt"
file delete $out
proc snap {label} {
    global out
    set f [open $out a]
    set px [debug read memory 0xC001]
    set py [debug read memory 0xC000]
    puts $f "$label pos=($px,$py)"
    close $f
}
# Pass Game Flow menu/intro with SPACE presses
after time 6  { keymatrixdown 8 0x01 }
after time 7  { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 9  { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 11 { keymatrixup 8 0x01 }
after time 13 { snap in_game }
after time 14 { keymatrixdown 8 0x80 }
after time 17 { keymatrixup 8 0x80 ; snap after_right }
after time 18 { screenshot C:/Users/salam/Documents/Programacion/Mideas/test/mapper-2m/k4_screen.png }
after time 19 { exit }
