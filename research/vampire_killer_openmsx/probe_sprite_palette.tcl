set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_sprite_palette.log" "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc kd {row mask label} { keymatrixdown $row $mask; logline "KD $label" }
proc ku {row mask label} { keymatrixup $row $mask; logline "KU $label" }
after time 9.0 { kd 8 1 SPACE1 }
after time 9.2 { ku 8 1 SPACE1 }
after time 12.0 { kd 8 1 SPACE2 }
after time 12.2 { ku 8 1 SPACE2 }
after time 22.2 { kd 8 128 RIGHT }
after time 24.0 { ku 8 128 RIGHT }
after time 24.2 {
    set parts {}
    for {set i 0} {$i < 32} {incr i} {
        if {[catch {debug read "VDP palette" $i} v]} { set v -1 }
        lappend parts [format "%02d=%02X" $i $v]
    }
    logline "PALETTE [join $parts " "]"
    close $::f
    exit
}
