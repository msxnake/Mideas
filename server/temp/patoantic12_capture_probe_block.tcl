set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic12_autosave(8)_unified.rom"
set __out "C:/Users/salam/Documents/Programacion/Mideas/screenshots/patoantic12_autosave8_probe_block.png"
if {[catch {carta $__rom} e]} {
  exit 1
}
after 9000
if {[catch {screenshot $__out} e2]} {
  if {[catch {savescreen $__out} e3]} {
    exit 2
  }
}
after 400
exit
