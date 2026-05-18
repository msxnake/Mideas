set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas80_megarom_move.log"
set f [open $log_path w]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc tap {key tag} { logline $tag; keymatrixdown $key; after 120; keymatrixup $key }
proc shot {name tag} { set p "C:/Users/salam/Documents/Programacion/Mideas/screenshots/$name"; catch { screenshot $p } r; logline "$tag $r $p" }
after 4000
keymatrixdown SPACE
after 120
keymatrixup SPACE
after 1800
keymatrixdown SPACE
after 120
keymatrixup SPACE
after 1800
shot "atenas80_megarom_move_start.png" "shot_start"
keymatrixdown RIGHT
after 5000
keymatrixup RIGHT
after 500
shot "atenas80_megarom_move_right5s.png" "shot_right5"
keymatrixdown RIGHT
after 5000
keymatrixup RIGHT
after 500
shot "atenas80_megarom_move_right10s.png" "shot_right10"
close $f
exit
