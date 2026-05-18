set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas80_probe_long.log"
set f [open $log_path w]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc tap_space {tag} { logline $tag; keymatrixdown 8 1; after time 0.12 { keymatrixup 8 1 } }
proc shot {name tag} { global f; set p "C:/Users/salam/Documents/Programacion/Mideas/screenshots/$name"; catch { screenshot $p } r; logline "$tag $r $p" }
after time 2.0 { shot "atenas80_long_t2.png" "shot2" }
after time 4.0 { tap_space "spc4" }
after time 6.0 { tap_space "spc6" }
after time 8.0 { shot "atenas80_long_t8.png" "shot8" }
after time 9.0 { tap_space "spc9" }
after time 11.0 { tap_space "spc11" }
after time 13.0 { tap_space "spc13" }
after time 15.0 { shot "atenas80_long_t15.png" "shot15" }
after time 16.0 { tap_space "spc16" }
after time 18.0 { tap_space "spc18" }
after time 20.0 { tap_space "spc20" }
after time 22.0 { shot "atenas80_long_t22.png" "shot22" }
after time 24.0 { tap_space "spc24" }
after time 26.0 { tap_space "spc26" }
after time 28.0 { shot "atenas80_long_t28.png" "shot28" }
after time 30.0 { close $f; exit }
