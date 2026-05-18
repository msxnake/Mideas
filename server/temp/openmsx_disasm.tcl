set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_disasm.log" "w"]
for {set a 0x9B90} {$a < 0x9C00} {incr a} {
    if {[catch {debug disasm $a} d]} {
        puts $f "$a ERR $d"
    } else {
        puts $f "$a $d"
    }
}
flush $f
close $f
exit
