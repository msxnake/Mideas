set probe_path "C:/Users/salam/Documents/Programacion/Mideas/test/or-fix/probe.txt"
set shot_path "C:/Users/salam/Documents/Programacion/Mideas/test/or-fix/newOne10_moving.png"
set attempts 0
proc do_capture {} {
    set f [open $::probe_path w]
    puts $f [format "anim_frame=%02X" [debug read memory 0xC005]]
    puts $f [format "colors_loaded=%02X" [debug read memory 0xC00C]]
    puts $f [format "player_x=%02X" [debug read memory 0xC001]]
    puts $f [format "player_moving=%02X" [debug read memory 0xC00A]]
    set v0 ""
    for {set i 0} {$i < 16} {incr i} { append v0 [format "%02X " [debug read VRAM [expr {0xF400 + $i}]]] }
    puts $f "vram_F400_L0=$v0"
    set v1 ""
    for {set i 0} {$i < 16} {incr i} { append v1 [format "%02X " [debug read VRAM [expr {0xF410 + $i}]]] }
    puts $f "vram_F410_L1=$v1"
    close $f
    screenshot $::shot_path
    after time 0.2 { exit }
}
proc poll {} {
    incr ::attempts
    set frame [debug read memory 0xC005]
    if {$frame != 0 || $::attempts > 80} { do_capture } else { after time 0.05 poll }
}
after time 5 { keymatrixdown 8 0x80 }
after time 6 { poll }
