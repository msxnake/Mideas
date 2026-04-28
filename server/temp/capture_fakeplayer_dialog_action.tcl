set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_dialog_top_fixed2_unified.rom"
set __out "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_dialog_action_after_space.png"
set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_dialog_action_capture.log"
file delete -force $__log
proc logline {msg} { global __log; set fh [open $__log a]; puts $fh $msg; close $fh }
logline "loading ROM"
if {[catch {carta $__rom} err]} { logline "carta error $err"; quit }
after realtime 5.0 { logline "press SPACE"; keymatrixdown SPACE }
after realtime 5.2 { logline "release SPACE"; keymatrixup SPACE }
after realtime 7.0 {
    global __out
    logline "capture $__out"
    if {[catch {screenshot $__out} serr]} { logline "screenshot error $serr" } else { logline "screenshot ok" }
    after realtime 0.5 { quit }
}
