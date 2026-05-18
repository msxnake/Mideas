set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_megarom_loader_disasm.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

debug write memory 0x6000 0x06

for {set a 0x62A0} {$a < 0x62E0} {incr a} {
    if {[catch {debug disasm $a} d]} {
        logline [format "DIS %04X ERR %s" $a $d]
    } else {
        logline [format "DIS %04X %s" $a $d]
    }
}

close $f
exit
