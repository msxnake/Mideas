set fd [open "C:/Users/salam/Downloads/mideas_textscroll_fixed_di_openmsx_probe.log" "w"]
proc grab {name label} {
    global fd
    set out "C:/Users/salam/Downloads/mideas_textscroll_fixed_di_shots/$name"
    screenshot $out
    puts $fd "shot $label $out"
    flush $fd
}
after time 6.0 { grab "textscroll_fixed_di_06s.png" "6s" }
after time 8.0 { grab "textscroll_fixed_di_08s.png" "8s" }
after time 10.0 { grab "textscroll_fixed_di_10s.png" "10s" }
after time 12.0 { grab "textscroll_fixed_di_12s.png" "12s" }
after time 14.0 { grab "textscroll_fixed_di_14s.png" "14s" }
after time 14.5 { close $fd; exit }
