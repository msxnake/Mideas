set probe_path "C:/Users/salam/Documents/Programacion/Mideas/test/or-fix/dj_probe.txt"
set shot_path "C:/Users/salam/Documents/Programacion/Mideas/test/or-fix/newOne10_dj.png"
set ::min_y 255
set ::sampling 0
proc sample_y {} {
    if {!$::sampling} return
    set y [debug read memory 0xC000]
    if {$y < $::min_y} { set ::min_y $y }
    after time 0.016 sample_y
}
after time 5.0 {
    set ::yg [debug read memory 0xC000]
    set ::fg [debug read memory 0xC007]
    set ::sampling 1
    sample_y
    keymatrixdown 8 0x20
}
after time 5.05 {
    set ::ju1 [debug read memory 0xC00D]
    set ::vy1 [debug read memory 0xC006]
    set ::fl1 [debug read memory 0xC007]
    keymatrixup 8 0x20
}
after time 5.10 { keymatrixdown 8 0x20 }
after time 5.15 {
    set ::ju2 [debug read memory 0xC00D]
    set ::vy2 [debug read memory 0xC006]
    set ::fl2 [debug read memory 0xC007]
    keymatrixup 8 0x20
}
after time 5.7 {
    set ::sampling 0
    set f [open $::probe_path w]
    puts $f [format "y_ground=%d flags_ground=%02X" $::yg $::fg]
    puts $f [format "after_jump1: jumps_used=%d vy=%02X flags=%02X" $::ju1 $::vy1 $::fl1]
    puts $f [format "after_jump2: jumps_used=%d vy=%02X flags=%02X" $::ju2 $::vy2 $::fl2]
    puts $f [format "apex_min_y=%d  total_rise_px=%d" $::min_y [expr {$::yg - $::min_y}]]
    close $f
    screenshot $::shot_path
    after time 0.2 { exit }
}
