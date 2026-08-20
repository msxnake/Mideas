set log_path "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551-capture.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
after time 8.000 {
    if {[catch {screenshot "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551-capture.png"} err]} {
        logline "SHOTERR $err"
    } else {
        logline "SHOTOK"
    }
    close $f
    after time 0.200 { exit }
}
debug cont
