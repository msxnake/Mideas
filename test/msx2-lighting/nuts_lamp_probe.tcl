# Same pickup as nuts_torchoff_probe, but in the fixture whose lamp is ALWAYS on.
# The player stops ON the collected cell, so the halo covers it: the background
# restored there must come back LIT (#11/#22), not dark. This is the other half
# of the dark-room fix — dimming a repaint must not punch a hole in the light the
# player is standing in.

set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/nuts_lamp_log.txt"
set log [open $logpath w]

proc L {msg} { global log; puts $log $msg; flush $log }

proc row {y x0 x1} {
    set out ""
    for {set x $x0} {$x <= $x1} {incr x 2} {
        append out [format "%02X " [debug read VRAM [expr {$y * 128 + $x / 2}]]]
    }
    return $out
}

proc dump {tag} {
    set nuts [debug read memory 0xD00B]
    set px   [debug read memory 0xC001]
    set py   [debug read memory 0xC000]
    L "$tag nuts=$nuts player=($px,$py)"
    L "   nut0 cell (x48..62): y=150 [row 150 48 62]"
    L "                        y=155 [row 155 48 62]"
    L "                        y=160 [row 160 48 62]"
    L "   far reference (x=200): [row 155 200 206]"
}

after time 6   { dump t6_before_walk }
after time 6.4 { keymatrixdown 8 0x80 }
after time 6.9 { keymatrixup 8 0x80 }
after time 7.6 { dump t7_standing_on_the_collected_cell }
after time 8 {
    screenshot -prefix nuts_lamp_
    close $log
    exit
}
