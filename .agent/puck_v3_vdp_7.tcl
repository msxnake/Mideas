set f [open "C:/Users/salam/Documents/Programacion/Mideas/.agent/puck_v3_vdp_7.log" "w"]
after time 7.0 {
    puts $f [format "r1=%d r5=%d r6=%d r8=%d r9=%d r11=%d" [debug read "VDP regs" 1] [debug read "VDP regs" 5] [debug read "VDP regs" 6] [debug read "VDP regs" 8] [debug read "VDP regs" 9] [debug read "VDP regs" 11]]
    flush $f
    close $f
    exit
}
