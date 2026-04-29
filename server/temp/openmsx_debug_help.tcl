set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_debug_help.log" "w"]
catch {puts $f [help debug]} err
puts $f "ERR=$err"
catch {puts $f [help debug set_breakpoint]} err2
puts $f "ERR2=$err2"
close $f
exit
