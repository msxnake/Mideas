set fd [open "C:/Users/salam/Downloads/mideas_textscroll_fixed_late_openmsx_probe.log" "w"]
proc grab {name label} {
    global fd
    set out "C:/Users/salam/Downloads/mideas_textscroll_fixed_late_shots/$name"
    screenshot $out
    puts $fd "shot $label $out"
    flush $fd
}
after time 11.0 { grab "textscroll_fixed_11s.png" "11s" }
after time 12.0 { grab "textscroll_fixed_12s.png" "12s" }
after time 13.0 { grab "textscroll_fixed_13s.png" "13s" }
after time 14.0 { grab "textscroll_fixed_14s.png" "14s" }
after time 15.0 { grab "textscroll_fixed_15s.png" "15s" }
after time 16.0 { grab "textscroll_fixed_16s.png" "16s" }
after time 17.0 { grab "textscroll_fixed_17s.png" "17s" }
after time 17.5 { close $fd; exit }
