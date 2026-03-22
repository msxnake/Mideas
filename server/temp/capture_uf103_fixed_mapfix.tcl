set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/uf103_fixed_mapfix.rom"
set __out "C:/Users/salam/Documents/Programacion/Mideas/server/temp/uf103_fixed_mapfix.png"
set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/capture_uf103_fixed_mapfix.log"

proc logline {msg} {
    global __log
    set fh [open $__log a]
    puts $fh $msg
    close $fh
}

file delete -force $__log
file delete -force $__out
logline "CAPTURE: loading $__rom"
if {[catch {carta $__rom} err]} {
    logline "CAPTURE ERROR: failed to load ROM: $err"
    quit
}
after time 8000 {
    if {[catch {screenshot $__out} err]} {
        logline "CAPTURE ERROR: screenshot failed: $err"
        quit
    }
    logline "CAPTURE: saved $__out"
    quit
}
vwait __forever
