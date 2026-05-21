set f [open "C:/Users/salam/Documents/Programacion/Mideas/.agent/puck_v2_state_6.log" "w"]
proc m {addr} { return [debug read memory $addr] }
after time 6.0 {
    puts $f [format "player=%d,%d lives=%d gameover=%d e0=%d,%d e1=%d,%d e2=%d,%d e3=%d,%d" [m 0xC000] [m 0xC001] [m 0xC011] [m 0xC012] [m 0xC2E0] [m 0xC2E4] [m 0xC2E1] [m 0xC2E5] [m 0xC2E2] [m 0xC2E6] [m 0xC2E3] [m 0xC2E7]]
    flush $f
    close $f
    exit
}
