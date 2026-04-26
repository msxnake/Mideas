set __out {C:/Users/salam/Documents/Programacion/Mideas/server/temp/screenshots/joc39_3_capture_vwait.png}
after realtime 6000 {
  puts "CAPTURE_START $__out"
  if {[catch {screenshot $__out} err]} {
    puts "SCREENSHOT_ERROR $err"
    if {[catch {savescreen $__out} err2]} {
      puts "SAVESCREEN_ERROR $err2"
    } else {
      puts "SAVESCREEN_OK $__out"
    }
  } else {
    puts "SCREENSHOT_OK $__out"
  }
  set __done 1
}
vwait __done
after realtime 300 { exit }
