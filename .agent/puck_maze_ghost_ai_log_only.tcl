set log_path "C:/Users/salam/Documents/Programacion/Mideas/.agent/puck_maze_ghost_ai_log_only.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
}

proc mem8 {addr} { return [debug read memory $addr] }

proc enemy_state {tag} {
    set px [mem8 0xC000]
    set py [mem8 0xC001]
    set lives [mem8 0xC011]
    set gameover [mem8 0xC012]
    set e0x [mem8 0xC2E0]
    set e1x [mem8 0xC2E1]
    set e2x [mem8 0xC2E2]
    set e3x [mem8 0xC2E3]
    set e0y [mem8 0xC2E4]
    set e1y [mem8 0xC2E5]
    set e2y [mem8 0xC2E6]
    set e3y [mem8 0xC2E7]
    set e0mode [mem8 0xC2F0]
    set e1mode [mem8 0xC2F1]
    set e2mode [mem8 0xC2F2]
    set e3mode [mem8 0xC2F3]
    logline [format "%s player=%d,%d lives=%d gameover=%d e0=%d,%d,m%d e1=%d,%d,m%d e2=%d,%d,m%d e3=%d,%d,m%d" $tag $px $py $lives $gameover $e0x $e0y $e0mode $e1x $e1y $e1mode $e2x $e2y $e2mode $e3x $e3y $e3mode]
}

after time 6.0 { enemy_state "t0" }
after time 8.5 { enemy_state "t1" }
after time 11.0 { enemy_state "t2" }
after time 13.5 { enemy_state "t3"; close $f; exit }
