set __out "C:/Users/salam/Documents/Programacion/Mideas/server/temp/captures/patoantic132_boot_8000ms.png"
set __errf "C:/Users/salam/Documents/Programacion/Mideas/server/temp/captures/patoantic132_boot_8000ms.error.txt"
after time 8000 {
    if {[catch {screenshot $__out} err]} {
        set f [open $__errf "w"]
        puts $f $err
        close $f
    }
    exit
}
vwait __wait_forever