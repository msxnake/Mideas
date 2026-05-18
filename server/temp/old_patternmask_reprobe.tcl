set fd [open "C:/Users/salam/Downloads/old_patternmask_probe.log" "w"]
if {[catch {carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas_textscroll1_patternmask_fix.rom"} err]} { puts $fd "ERR $err"; flush $fd; exit 1 }
after realtime 7.0 { screenshot "C:/Users/salam/Downloads/old_patternmask_reprobe_07s.png"; puts $fd "shot"; flush $fd; exit }
