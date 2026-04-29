set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_keymatrix_help.log" w]
if {[catch {help keymatrixdown} msg]} {
    puts $f "ERR $msg"
} else {
    puts $f $msg
}
close $f
exit
