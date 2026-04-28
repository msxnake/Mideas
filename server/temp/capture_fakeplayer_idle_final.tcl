set __out "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_idle_final_capture.png"
set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_idle_final_capture.log"
file delete -force $__log
proc logline {msg} { global __log; set fh [open $__log a]; puts $fh $msg; close $fh }
after realtime 9 {
    if {[catch {screenshot $__out} serr]} { logline "screenshot error $serr" } else { logline "screenshot ok $__out" }
    after realtime 0.5 { quit }
}
