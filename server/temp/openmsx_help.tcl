set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_help.log" w]
if {[catch {help keymatrixdown} err]} {puts $f "ERR $err"} else {puts $f "OK"}
if {[catch {help keymatrixup} err]} {puts $f "ERR2 $err"} else {puts $f "OK2"}
close $f
exit
