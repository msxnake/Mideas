set fd [open "C:/Users/salam/Downloads/mideas_textscroll_test_openmsx_probe.log" "w"]
proc logline {msg} {
    global fd
    puts $fd $msg
    flush $fd
}
proc grab {name label} {
    global fd
    set out "C:/Users/salam/Downloads/mideas_textscroll_test_shots/$name"
    screenshot $out
    puts $fd "shot $label $out"
    flush $fd
}
logline "textscroll probe started"
after time 1.0 { grab "textscroll_01s.png" "1s" }
after time 2.0 { grab "textscroll_02s.png" "2s" }
after time 3.0 { grab "textscroll_03s.png" "3s" }
after time 4.0 { grab "textscroll_04s.png" "4s" }
after time 5.0 { grab "textscroll_05s.png" "5s" }
after time 6.0 { grab "textscroll_06s.png" "6s" }
after time 7.0 { grab "textscroll_07s.png" "7s" }
after time 8.0 { grab "textscroll_08s.png" "8s" }
after time 8.5 { logline "done"; close $fd; exit }
