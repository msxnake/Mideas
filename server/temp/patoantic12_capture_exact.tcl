set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic12_autosave8_unified.rom"
set __wait_ms 9000
set __out "C:/Users/salam/Documents/Programacion/Mideas/screenshots/patoantic12_autosave8_exact.png"
puts "CAPTURE: Loading ROM $__rom"
if {[catch {carta $__rom} err]} {
    puts "CAPTURE ERROR: failed to load ROM: $err"
    exit 1
}
puts "CAPTURE: Waiting $__wait_ms ms before screenshot..."
after $__wait_ms
if {[catch {screenshot $__out} err]} {
    puts "CAPTURE ERROR: screenshot failed: $err"
    exit 1
}
puts "CAPTURE: Screenshot saved to $__out"
after 500
exit
