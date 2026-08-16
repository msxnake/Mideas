# Dark room + torch OFF: collecting a nut must NOT leave a lit patch behind.
#
# The room is composed from the pre-dimmed atlas twin (background #99 = backdrop
# 1 dimmed), while every pickup command template is authored from the LIT atlas
# (#11). With the player carrying no light, the 16x16 cell a collected nut
# leaves behind has to end up at #99, exactly like the darkness around it.
#
# Nut 0 sits at room cell (48,128) -> page rect x 48..63, y 148..163.
# SCREEN 5 page 0: address = y * 128 + x / 2.

set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/nuts_torchoff_log.txt"
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
    L "   nut0 cell rows (x48..62):"
    L "     y=150 [row 150 48 62]"
    L "     y=155 [row 155 48 62]"
    L "     y=160 [row 160 48 62]"
    L "   dark reference (x=200, same rows): [row 150 200 206] / [row 155 200 206]"
}

after time 6   { dump t6_room_up_before_walk }
after time 6.5 { keymatrixdown 8 0x80 }
after time 10  { keymatrixup 8 0x80 }
after time 10.5 { dump t10_after_collecting }
after time 11 {
    screenshot -prefix nuts_torchoff_
    close $log
    exit
}
