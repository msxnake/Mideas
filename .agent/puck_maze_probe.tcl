set log_path "C:/Users/salam/Documents/Programacion/Mideas/.agent/puck_maze_probe.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }

proc state {tag} {
    set pc [reg PC]
    set x [mem8 0xC000]
    set y [mem8 0xC001]
    set dx [mem8 0xC002]
    set screen [mem8 0xC00B]
    set collected [mem8 0xC00E]
    set gameover [mem8 0xC012]
    set complete [mem8 0xC014]
    logline [format "%s pc=%04X x=%d y=%d dx=%d screen=%d collected=%d gameover=%d complete=%d" $tag $pc $x $y $dx $screen $collected $gameover $complete]
}

proc shot {name tag} {
    state $tag
    screenshot "C:/Users/salam/Downloads/$name"
    logline "SHOTOK $name"
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc hold {tag mask duration} {
    state "${tag}_before"
    down $mask
    after time $duration [list release $tag $mask]
}

proc release {tag mask} {
    up $mask
    state "${tag}_after"
}

after time 5.0 { shot "puck_maze_start.png" "start" }
after time 5.4 { hold "right" 128 0.8 }
after time 6.5 { shot "puck_maze_after_right.png" "after_right" }
after time 6.9 { hold "down" 64 0.8 }
after time 8.0 { shot "puck_maze_after_down.png" "after_down" }
after time 8.4 { hold "left" 16 0.8 }
after time 9.5 { shot "puck_maze_after_left.png" "after_left"; close $f; exit }
