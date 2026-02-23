set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic12_autosave(8)_unified.rom"
set __out "C:/Users/salam/Documents/Programacion/Mideas/screenshots/patoantic12_autosave8_probe.png"
puts "LOAD:C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic12_autosave(8)_unified.rom"
if {[catch {carta } e]} {
  puts "ERR_LOAD:"
  exit 1
}
after time 9000 {
  if {[catch {screenshot } e2]} {
    puts "ERR_SS:"
    if {[catch {savescreen } e3]} {
      puts "ERR_SAVE:"
    } else {
      puts "OK_SAVE"
    }
  } else {
    puts "OK_SS"
  }
  puts "EXISTS:[file exists ]"
  exit
}
