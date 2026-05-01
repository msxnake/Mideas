set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/probe_joc51_mirror.log"
set f [open $log_path "w"]
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }

proc state {tag} {
    set input [mem8 0xC000]
    set player [mem8 0xDEF6]
    set hero [mem8 0xE467]
    set idx $player
    if {$idx == 255} { set idx $hero }
    if {$idx == 255} {
        set face 255
        set sprite 255
        set smlo 0
        set smhi 0
        set smctl 0
        set wallgrab 0
        set x 0
        set y 0
    } else {
        set face [mem8 [expr {0xDC98 + $idx}]]
        set sprite [mem8 [expr {0xDDB8 + $idx}]]
        set smlo [mem8 [expr {0xDB58 + $idx}]]
        set smhi [mem8 [expr {0xDB78 + $idx}]]
        set smctl [mem8 [expr {0xDBF8 + $idx}]]
        set wallgrab [mem8 [expr {0xD8B7 + $idx}]]
        set x [mem8 [expr {0xD957 + $idx}]]
        set y [mem8 [expr {0xD977 + $idx}]]
    }
    logline [format "%s input=%02X player=%02X hero=%02X idx=%02X face=%02X sprite=%02X sm=%02X%02X smctl=%02X wallgrab=%02X xy=%d,%d" $tag $input $player $hero $idx $face $sprite $smhi $smlo $smctl $wallgrab $x $y]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc tap_space {tag} {
    state ${tag}_before
    down 1
    after time 0.20 [list up 1]
    after time 0.25 [list state ${tag}_after]
}

proc hold_left {tag duration} {
    state ${tag}_before
    down 16
    after time 0.15 [list state ${tag}_during_015]
    after time 0.45 [list state ${tag}_during_045]
    after time $duration [list release_left $tag]
}

proc release_left {tag} {
    up 16
    state ${tag}_after
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

after time 2.0  { state "boot_2s" }
after time 7.0  { tap_space "intro" }
after time 10.0 { state "after_intro_wait" }
after time 12.0 { tap_space "start" }
after time 13.5 { shot "joc51_mirror_start.png" "game_start" }
after time 14.2 { hold_left "left" 0.90 }
after time 14.8 { shot "joc51_mirror_left_mid.png" "left_mid" }
after time 15.4 { shot "joc51_mirror_left_after.png" "left_after" }
after time 16.0 { close $f; exit }
