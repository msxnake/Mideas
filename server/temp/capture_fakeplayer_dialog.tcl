set __out {C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_dialog_top_capture.png}
puts "CAPTURE_WAIT"
after time 5000 {
    puts "CAPTURE_NOW $__out"
    if {[catch {screenshot $__out} err]} {
        puts "SCREENSHOT_ERROR $err"
    } else {
        puts "SCREENSHOT_OK $__out"
    }
    after time 500 { exit }
}
