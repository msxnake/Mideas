set fd [open "C:/Users/salam/Downloads/mideas_textscroll_rowblend_late2.log" "w"]
if {[catch {carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas_textscroll_rowblend_megarom.rom"} err]} { puts $fd "ERROR carta $err"; flush $fd; exit 1 }
proc grab {name label} { global fd; set out "C:/Users/salam/Downloads/mideas_textscroll_rowblend_shots/$name"; screenshot $out; puts $fd "shot $label $out"; flush $fd }
after realtime 13.0 { grab "textscroll_rowblend_13s.png" "13s" }
after realtime 15.0 { grab "textscroll_rowblend_15s.png" "15s" }
after realtime 17.0 { grab "textscroll_rowblend_17s.png" "17s" }
after realtime 19.0 { grab "textscroll_rowblend_19s.png" "19s" }
after realtime 19.5 { close $fd; exit }
