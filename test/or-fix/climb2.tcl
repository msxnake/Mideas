set probe_path "C:/Users/salam/Documents/Programacion/Mideas/test/or-fix/climb2_probe.txt"
set shot_path "C:/Users/salam/Documents/Programacion/Mideas/test/or-fix/newOne10_climb2.png"
after time 5.0 {
    for {set r 0} {$r < 12} {incr r} { debug write memory [expr {0xC010 + $r*16 + 3}] 0x01 }
    set ::y0 [debug read memory 0xC000]
    keymatrixdown 8 0xA0
}
after time 5.40 { set ::yup [debug read memory 0xC000]; keymatrixup 8 0xA0; keymatrixdown 8 0x80 }
after time 5.78 { set ::ycling [debug read memory 0xC000]; keymatrixup 8 0x80; keymatrixdown 8 0xC0 }
after time 6.10 {
    set ::ydown [debug read memory 0xC000]
    keymatrixup 8 0xC0
    set f [open $::probe_path w]
    puts $f [format "y0=%d" $::y0]
    puts $f [format "UP:    y=%d  climbed_up=%d  (debe subir)" $::yup [expr {$::y0-$::yup}]]
    puts $f [format "CLING: y=%d  drift=%d  (debe ~0, no caer)" $::ycling [expr {$::ycling-$::yup}]]
    puts $f [format "DOWN:  y=%d  descended=%d  (debe bajar)" $::ydown [expr {$::ydown-$::ycling}]]
    close $f
    screenshot $::shot_path
    after time 0.2 { exit }
}
