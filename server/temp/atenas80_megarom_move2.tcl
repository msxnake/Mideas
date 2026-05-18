set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas80_megarom_move2.log"
set f [open $log_path "w"]
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc state {tag} { logline $tag }
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc release {tag masks} { foreach m $masks { up $m }; state ${tag}_after }
proc hold {tag masks duration} { state ${tag}_before; foreach m $masks { down $m }; after time $duration [list release $tag $masks] }
proc shot {name tag} { global shot_dir; set p "$shot_dir/$name"; catch { screenshot $p } r; logline "$tag $r $p" }
proc tap_space {tag} { hold $tag {1} 0.25 }
after time 4.0 { tap_space "spc4" }
after time 6.0 { tap_space "spc6" }
after time 8.0 { shot "atenas80_megarom_move2_start.png" "shot_start" }
after time 8.2 { hold "RIGHT1" {128} 4.0 }
after time 12.5 { shot "atenas80_megarom_move2_right4s.png" "shot_right4" }
after time 12.8 { hold "RIGHT2" {128} 5.0 }
after time 18.0 { shot "atenas80_megarom_move2_right9s.png" "shot_right9" }
after time 18.3 { hold "RIGHT3" {128} 6.0 }
after time 24.5 { shot "atenas80_megarom_move2_right15s.png" "shot_right15" }
after time 25.0 { close $f; exit }
