set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas80_megarom_clear_probe.log"
set f [open $log_path w]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc tap_space {tag} { logline $tag; keymatrixdown 8 1; after time 0.12 { keymatrixup 8 1 } }
proc shot {name tag} { set p "C:/Users/salam/Documents/Programacion/Mideas/screenshots/$name"; catch { screenshot $p } r; logline "$tag $r $p" }
after time 2.0 { shot "atenas80_megarom_clear_t2.png" "shot2" }
after time 4.0 { tap_space "spc4" }
after time 6.0 { tap_space "spc6" }
after time 8.0 { shot "atenas80_megarom_clear_t8.png" "shot8" }
after time 10.0 { close $f; exit }
