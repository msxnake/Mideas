set log_path "C:/Users/salam/Documents/Programacion/Mideas/.agent/puck_maze_ghost_ai_probe.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
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
    set e0dx [mem8 0xC2E8]
    set e1dx [mem8 0xC2E9]
    set e2dx [mem8 0xC2EA]
    set e3dx [mem8 0xC2EB]
    set e0dy [mem8 0xC2EC]
    set e1dy [mem8 0xC2ED]
    set e2dy [mem8 0xC2EE]
    set e3dy [mem8 0xC2EF]
    set e0mode [mem8 0xC2F0]
    set e1mode [mem8 0xC2F1]
    set e2mode [mem8 0xC2F2]
    set e3mode [mem8 0xC2F3]
    logline [format "%s player=%d,%d lives=%d gameover=%d e0=%d,%d,%d,%d,m%d e1=%d,%d,%d,%d,m%d e2=%d,%d,%d,%d,m%d e3=%d,%d,%d,%d,m%d" $tag $px $py $lives $gameover $e0x $e0y $e0dx $e0dy $e0mode $e1x $e1y $e1dx $e1dy $e1mode $e2x $e2y $e2dx $e2dy $e2mode $e3x $e3y $e3dx $e3dy $e3mode]
}

after time 6.0 { enemy_state "t0"; screenshot "C:/Users/salam/Downloads/puck_ghost_ai_t0.png" }
after time 8.5 { enemy_state "t1"; screenshot "C:/Users/salam/Downloads/puck_ghost_ai_t1.png" }
after time 11.0 { enemy_state "t2"; screenshot "C:/Users/salam/Downloads/puck_ghost_ai_t2.png" }
after time 13.5 { enemy_state "t3"; screenshot "C:/Users/salam/Downloads/puck_ghost_ai_t3.png"; close $f; exit }
