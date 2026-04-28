set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_dialog_more_text_upper_unified.rom"
set __out "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_more_text_upper_probe.png"
set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_more_text_upper_probe.log"
file delete -force $__log
proc logline {msg} { global __log; set fh [open $__log a]; puts $fh $msg; close $fh }
if {[catch {carta $__rom} err]} { logline "carta error $err"; quit }
after realtime 7 {
    if {[catch {screenshot $__out} serr]} { logline "screenshot error $serr" } else { logline "screenshot ok $__out" }
    after realtime 0.5 { quit }
}
