set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas13_anim_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc state {tag} {
    set pc [reg PC]
    set input [mem8 0xC000]
    set prev [mem8 0xC001]
    set player [mem8 0xDEF4]
    set px [mem8 0xD954]
    set py [mem8 0xD974]
    set vx [mem8 0xD994]
    set vy [mem8 0xD9B4]
    set frame [mem8 0xDAD5]
    set tick [mem8 0xDAF5]
    set sprite [mem8 0xDDB5]
    set smptr [mem16 0xDB55]
    logline [format "%s pc=%04X input=%02X prev=%02X player=%02X xy=%d,%d v=%02X/%02X anim=%d tick=%d sprite=%02X sm=%04X" $tag $pc $input $prev $player $px $py $vx $vy $frame $tick $sprite $smptr]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc tap_space {tag} {
    state ${tag}_before
    down 1
    after time 0.20 [list up 1]
    after time 0.25 [list state ${tag}_after]
}

proc hold_right {tag} {
    state ${tag}_before
    down 128
    after time 0.40 [list state ${tag}_held_040]
    after time 0.80 [list state ${tag}_held_080]
    after time 1.20 [list state ${tag}_held_120]
    after time 1.60 [list state ${tag}_held_160]
    after time 1.70 [list up 128]
    after time 1.90 [list state ${tag}_released]
}

after time 3.0 { state "boot_3s" }
after time 7.0 { tap_space "space1" }
after time 12.0 { tap_space "space2" }
after time 13.3 { state "before_move" }
after time 14.0 { hold_right "right" }
after time 16.2 { screenshot "$shot_dir/atenas13_after_right.png"; state "after_shot" }
after time 17.0 { close $f; exit }
