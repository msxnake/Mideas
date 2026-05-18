set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_wrapper.log" "w"]
if {[catch {source "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_probe_32k.tcl"} err]} {
    puts $f "ERR $err"
} else {
    puts $f "OK"
}
flush $f
close $f
exit
