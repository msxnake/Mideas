set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic12_autosave8_unified.rom"
set __out "C:/Users/salam/Documents/Programacion/Mideas/screenshots/patoantic12_autosave8_aftertime.png"
if {[catch {carta $__rom} e]} {
  puts "CAPTURE ERROR LOAD: $e"
  exit 1
}
after time 10000
if {[catch {screenshot $__out} e2]} {
  puts "CAPTURE ERROR SCREENSHOT: $e2"
  if {[catch {savescreen $__out} e3]} {
    puts "CAPTURE ERROR SAVESCREEN: $e3"
    exit 2
  }
}
after time 300
exit
