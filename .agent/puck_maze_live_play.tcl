set log_path "C:/Users/salam/Documents/Programacion/Mideas/.agent/puck_maze_live_play.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }

proc state {tag} {
    set x [mem8 0xC000]
    set y [mem8 0xC001]
    set screen [mem8 0xC00B]
    set collected [mem8 0xC00E]
    set lives [mem8 0xC011]
    set gameover [mem8 0xC012]
    set complete [mem8 0xC014]
    logline [format "%s x=%d y=%d screen=%d collected=%d lives=%d gameover=%d complete=%d" $tag $x $y $screen $collected $lives $gameover $complete]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc release {tag mask} {
    up $mask
    state "${tag}_after"
}

proc hold {tag mask duration} {
    state "${tag}_before"
    down $mask
    after time $duration [list release $tag $mask]
}

after time 6.0 { state "start_ready" }
after time 6.5 { hold "RIGHT_to_first_corridor" 128 1.1 }
after time 8.5 { hold "DOWN_to_mid_lane" 64 0.9 }
after time 10.5 { hold "LEFT_collect_row" 16 1.7 }
after time 13.5 { hold "RIGHT_recover" 128 1.4 }
after time 16.0 { hold "LEFT_again" 16 0.9 }
after time 18.5 { state "end_visible"; logline "FINISHED_BUT_OPENMSX_STAYS_OPEN" }
