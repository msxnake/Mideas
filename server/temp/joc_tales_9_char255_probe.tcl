set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc_tales_9_char255_probe.log"
set f [open $log_path "w"]
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    logline [format "%s pc=%04X sp=%04X" $tag $pc $sp]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc tap_space {tag} {
    state ${tag}_before
    down 1
    after time 0.20 [list up 1]
    after time 0.25 [list state ${tag}_after]
}

proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} {
        logline "SHOTERR $err"
    } else {
        logline "SHOTOK $name"
    }
}

after time 4.0  { shot "joc_tales_9_char255_t4.png" "t4" }
after time 7.0  { tap_space "space1" }
after time 9.0  { shot "joc_tales_9_char255_t9.png" "t9" }
after time 12.0 { tap_space "space2" }
after time 14.0 { shot "joc_tales_9_char255_t14.png" "t14" }
after time 18.0 { shot "joc_tales_9_char255_t18.png" "t18"; close $f; exit }
