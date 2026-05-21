set f [open "C:/Users/salam/Documents/Programacion/Mideas/.agent/puck_v3_color_vram_7.log" "w"]
proc v {addr} { return [debug read VRAM $addr] }
after time 7.0 {
    set values {}
    for {set i 0} {$i < 96} {incr i} {
        lappend values [v [expr {0x7400 + $i}]]
    }
    puts $f $values
    flush $f
    close $f
    exit
}
