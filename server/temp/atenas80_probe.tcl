set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas80_probe.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc tap_space {tag} {
  logline $tag
  keymatrixdown 8 1
  after time 0.20 { keymatrixup 8 1 }
}
proc shot {name tag} {
  logline $tag
  if {[catch {screenshot "C:/Users/salam/Documents/Programacion/Mideas/screenshots/$name"} err]} { logline "SHOTERR $err" } else { logline "SHOTOK $name" }
}
after time 1.0 { tap_space "space_presentation" }
after time 3.0 { tap_space "space_dialog_1" }
after time 4.0 { tap_space "space_dialog_2" }
after time 5.0 { tap_space "space_extra" }
after time 7.0 { shot "atenas80_tilecache_fix_game.png" "shot_game" }
after time 8.0 { close $f; exit }
