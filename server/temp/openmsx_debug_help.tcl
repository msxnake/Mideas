after time 1.0 {
 set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_debug_help.txt" w]
 if {[catch {debug list} res]} {puts $f "ERR $res"} else {puts $f $res}
 close $f
 exit
}
