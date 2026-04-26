set __out {C:/Users/salam/Documents/Programacion/Mideas/server/temp/screenshots/joc39_3_capture_blocking_after.png}
puts "WAITING"
after 6000
puts "CAPTURE_START $__out"
if {[catch {screenshot $__out} err]} {
  puts "SCREENSHOT_ERROR $err"
  if {[catch {savescreen $__out} err2]} {
    puts "SAVESCREEN_ERROR $err2"
    exit 2
  }
}
puts "CAPTURE_DONE $__out"
after 500
exit
