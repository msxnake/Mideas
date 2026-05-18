set fd [open "C:/Users/salam/Downloads/mideas_textscroll_rowblend_late_probe.log" "w"]
if {[catch {carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas_textscroll_rowblend_megarom.rom"} err]} { puts $fd "ERR $err"; flush $fd; exit 1 }
after realtime 20.0 { screenshot "C:/Users/salam/Downloads/mideas_textscroll_rowblend_shots/textscroll_rowblend_20s.png"; puts $fd "shot20"; flush $fd }
after realtime 30.0 { screenshot "C:/Users/salam/Downloads/mideas_textscroll_rowblend_shots/textscroll_rowblend_30s.png"; puts $fd "shot30"; flush $fd; exit }
