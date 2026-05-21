set log_path "C:/Users/salam/Documents/Programacion/Mideas/.agent/puck_maze_playtest.log"
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
    set lives [mem8 0xC011]
    set gameover [mem8 0xC012]
    set complete [mem8 0xC014]
    logline [format "%s pc=%04X x=%d y=%d dx=%d screen=%d collected=%d lives=%d gameover=%d complete=%d" $tag $pc $x $y $dx $screen $collected $lives $gameover $complete]
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

after time 5.0 { shot "puck_play_00_start.png" "start" }
after time 5.3 { hold "right_1" 128 0.9 }
after time 6.4 { shot "puck_play_01_right.png" "after_right_1" }
after time 6.7 { hold "down_1" 64 0.8 }
after time 7.8 { shot "puck_play_02_down.png" "after_down_1" }
after time 8.1 { hold "left_1" 16 1.6 }
after time 10.0 { shot "puck_play_03_left.png" "after_left_1" }
after time 10.3 { hold "up_block_probe" 32 0.7 }
after time 11.3 { shot "puck_play_04_up_probe.png" "after_up_probe" }
after time 11.6 { hold "right_2" 128 1.3 }
after time 13.2 { shot "puck_play_05_right_2.png" "after_right_2" }
after time 13.5 { hold "down_2" 64 0.5 }
after time 14.3 { shot "puck_play_06_down_2.png" "after_down_2" }
after time 14.6 { hold "left_2" 16 0.9 }
after time 15.8 { shot "puck_play_07_final.png" "final"; close $f; exit }
