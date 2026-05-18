set fd [open "C:/Users/salam/Downloads/mideas_textscroll1_offbyone_fix_openmsx_probe.log" "w"]
proc grab {name label} {
    global fd
    set out "C:/Users/salam/Downloads/mideas_textscroll1_offbyone_fix_shots/$name"
    screenshot $out
    puts $fd "shot $label $out"
    flush $fd
}
after time 5.0 { grab "textscroll1_offbyone_05s.png" "5s" }
after time 6.0 { grab "textscroll1_offbyone_06s.png" "6s" }
after time 7.0 { grab "textscroll1_offbyone_07s.png" "7s" }
after time 8.0 { grab "textscroll1_offbyone_08s.png" "8s" }
after time 9.0 { grab "textscroll1_offbyone_09s.png" "9s" }
after time 10.0 { grab "textscroll1_offbyone_10s.png" "10s" }
after time 10.5 { close $fd; exit }
