set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/uf102_fixed.rom"
set __out "C:/Users/salam/Documents/Programacion/Mideas/server/temp/uf102_fixed.png"
set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/uf102_fixed_openmsx.log"

proc logline {msg} {
    global __log
    set fh [open $__log a]
    puts $fh $msg
    close $fh
}

file delete -force $__log
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
