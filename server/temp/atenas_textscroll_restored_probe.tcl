set fd [open "C:/Users/salam/Downloads/mideas_textscroll_restored_probe.log" "w"]
if {[catch {carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas_textscroll_rowblend_megarom.rom"} err]} { puts $fd "ERROR carta $err"; flush $fd; exit 1 }
proc grab {name label} { global fd; set out "C:/Users/salam/Downloads/mideas_textscroll_restored_shots/$name"; screenshot $out; puts $fd "shot $label $out"; flush $fd }
after realtime 7.0 { grab "textscroll_restored_07s.png" "7s" }
after realtime 9.0 { grab "textscroll_restored_09s.png" "9s" }
after realtime 11.0 { grab "textscroll_restored_11s.png" "11s" }
after realtime 13.0 { grab "textscroll_restored_13s.png" "13s" }
after realtime 13.5 { close $fd; exit }
