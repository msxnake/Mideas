set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas14_anim_probe.log"
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
    set input [mem8 0xC000]
    set prev [mem8 0xC001]
    set px [mem8 0xD954]
    set py [mem8 0xD974]
    set vx [mem8 0xD994]
    set vy [mem8 0xD9B4]
    set frame [mem8 0xDAD5]
    set tick [mem8 0xDAF5]
    set sprite [mem8 0xDDB5]
    set smptr [mem16 0xDB55]
    logline [format "%s input=%02X prev=%02X xy=%d,%d v=%02X/%02X anim=%d tick=%d sprite=%02X sm=%04X" $tag $input $prev $px $py $vx $vy $frame $tick $sprite $smptr]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc tap_space {tag} {
    state ${tag}_before
    down 1
    after time 0.20 [list up 1]
    after time 0.25 [list state ${tag}_after]
}

proc hold_key {tag mask duration} {
    state ${tag}_before
    down $mask
    after time 0.35 [list state ${tag}_held_035]
    after time 0.75 [list state ${tag}_held_075]
    after time 1.15 [list state ${tag}_held_115]
    after time $duration [list up $mask]
    after time [expr {$duration + 0.15}] [list state ${tag}_released]
}

after time 3.0 { state "boot_3s" }
after time 7.0 { tap_space "space1" }
after time 12.0 { tap_space "space2" }
after time 13.2 { state "start" }
after time 14.0 { hold_key "right" 128 1.45 }
after time 16.2 { hold_key "left" 16 1.45 }
after time 18.2 { state "final"; screenshot "$shot_dir/atenas14_final.png" }
after time 18.8 { close $f; exit }
