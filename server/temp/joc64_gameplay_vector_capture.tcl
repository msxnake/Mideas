set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc64_gameplay_vector_capture.log"
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
proc signed8 {v} {
    if {$v >= 128} { return [expr {$v - 256}] }
    return $v
}

proc state {tag} {
    set px [mem16 0xDEF0]
    set py [mem16 0xDEF2]
    set active [mem8 0xC047]
    set bx [mem8 0xC048]
    set by [mem8 0xC049]
    set vx [signed8 [mem8 0xC051]]
    set vy [signed8 [mem8 0xC052]]
    set target [mem8 0xC039]
    set tick [mem8 0xC005]
    logline [format "%s tick=%03d player=%d,%d projectileActive=%d projectile=%d,%d vel=%d,%d target=%d" $tag $tick $px $py $active $bx $by $vx $vy $target]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc tap_jump {tag} {
    state ${tag}_before
    down 1
    after time 0.12 [list up 1]
    after time 0.16 [list state ${tag}_after]
}

proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} {
        logline "SHOTERR $name $err"
    } else {
        logline "SHOTOK $name"
    }
}

after time 0.8  { down 128; state "right_down" }
after time 1.25 { tap_jump "jump1" }
after time 2.05 { shot "joc64_gameplay_frame1.png" "frame1" }
after time 3.25 { tap_jump "jump2" }
after time 4.95 { shot "joc64_gameplay_frame2.png" "frame2" }
after time 5.45 { tap_jump "jump3" }
after time 6.75 { tap_jump "jump4" }
after time 7.95 { shot "joc64_gameplay_frame3.png" "frame3" }
after time 8.20 { up 128; state "right_up"; close $f; exit }
