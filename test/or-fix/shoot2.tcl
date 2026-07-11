set probe_path "C:/Users/salam/Documents/Programacion/Mideas/test/or-fix/shoot_probe2.txt"
set shot_path "C:/Users/salam/Documents/Programacion/Mideas/test/or-fix/newOne10_shoot2.png"
proc fire {} { keymatrixdown 4 0x08 }
proc rel {}  { keymatrixup 4 0x08 }
after time 5.00 fire
after time 5.04 rel
after time 5.12 fire
after time 5.16 rel
after time 5.24 fire
after time 5.28 rel
after time 5.45 {
    set f [open $::probe_path w]
    puts $f [format "pool_active: s0=%d s1=%d s2=%d" [debug read memory 0xC0D9] [debug read memory 0xC0DD] [debug read memory 0xC0E1]]
    puts $f [format "pool_x:      s0=%d s1=%d s2=%d" [debug read memory 0xC0DA] [debug read memory 0xC0DE] [debug read memory 0xC0E2]]
    proc rd16 {addr} { set s ""; for {set i 0} {$i<4} {incr i} { append s [format "%02X " [debug read VRAM [expr {$addr+$i}]]] }; return $s }
    puts $f "color_F420 (bullet slot0): [rd16 0xF420]  (esperado 0F 0F 0F 0F)"
    puts $f "color_F430 (bullet slot1): [rd16 0xF430]"
    puts $f "color_F440 (bullet slot2): [rd16 0xF440]"
    close $f
    screenshot $::shot_path
    after time 0.2 { exit }
}
