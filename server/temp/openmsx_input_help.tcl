set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_input_help.log" w]
foreach cmd {keymatrixdown keymatrixup press type keydown keyup} {
    if {[catch {help $cmd} msg]} {
        puts $f "$cmd ERR $msg"
    } else {
        puts $f "$cmd OK $msg"
    }
}
close $f
exit
