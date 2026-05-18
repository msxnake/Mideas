set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas80_probe2.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc tap_space {tag} { logline $tag; keymatrixdown 8 1; after time 0.20 { keymatrixup 8 1 } }
proc shot {name tag} { logline $tag; if {[catch {screenshot "C:/Users/salam/Documents/Programacion/Mideas/screenshots/$name"} err]} { logline "SHOTERR $err" } else { logline "SHOTOK $name" } }
after time 1.0 { tap_space "spc1" }
after time 2.0 { tap_space "spc2" }
after time 3.0 { tap_space "spc3" }
after time 4.0 { tap_space "spc4" }
after time 5.0 { shot "atenas80_fix_t5.png" "shot5" }
after time 5.2 { tap_space "spc5" }
after time 6.0 { tap_space "spc6" }
after time 7.0 { tap_space "spc7" }
after time 8.0 { shot "atenas80_fix_t8.png" "shot8" }
after time 9.0 { tap_space "spc8" }
after time 10.0 { tap_space "spc9" }
after time 11.0 { tap_space "spc10" }
after time 12.0 { shot "atenas80_fix_t12.png" "shot12" }
after time 14.0 { shot "atenas80_fix_t14.png" "shot14" }
after time 16.0 { shot "atenas80_fix_t16.png" "shot16" }
after time 17.0 { close $f; exit }
