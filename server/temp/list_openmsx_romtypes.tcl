set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/list_openmsx_romtypes.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
if {[catch {openmsx_info romtypes} types]} {
    logline "ERR $types"
} else {
    logline $types
}
close $f
exit
