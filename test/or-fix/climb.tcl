set probe_path "C:/Users/salam/Documents/Programacion/Mideas/test/or-fix/climb_probe.txt"
set shot_path "C:/Users/salam/Documents/Programacion/Mideas/test/or-fix/newOne10_climb.png"
set ::miny 255
set ::sampling 0
proc samp {} {
    if {!$::sampling} return
    set y [debug read memory 0xC000]
    if {$y < $::miny} { set ::miny $y }
    after time 0.016 samp
}
after time 5.0 {
    # inject a full-height solid wall at column 3 (rows 0..11) into #C010
    for {set r 0} {$r < 12} {incr r} { debug write memory [expr {0xC010 + $r*16 + 3}] 0x01 }
    set ::y0 [debug read memory 0xC000]
    set ::sampling 1
    samp
    keymatrixdown 8 0xA0   ;# RIGHT(0x80)+UP(0x20)
}
after time 5.75 {
    set ::sampling 0
    set f [open $::probe_path w]
    puts $f [format "y0=%d  min_y=%d  climbed_px=%d" $::y0 $::miny [expr {$::y0 - $::miny}]]
    puts $f [format "y_final=%d  player_x=%d  facing=%d  vy=%02X" [debug read memory 0xC000] [debug read memory 0xC001] [debug read memory 0xC008] [debug read memory 0xC006]]
    close $f
    screenshot $::shot_path
    keymatrixup 8 0xA0
    after time 0.2 { exit }
}
