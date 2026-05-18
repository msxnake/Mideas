set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas121_msx1_navtest2.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas121_msx1_navtest2_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc down {v} { keymatrixdown 8 $v }
proc up {v} { keymatrixup 8 $v }
proc tap {tag v} { logline [format "%s pc=%04X" $tag [reg PC]]; down $v; after time 0.30 [list up $v] }
proc shot {name} { global shot_dir; screenshot "$shot_dir/$name"; logline "SHOTOK $name" }

after time 2.0 { tap "space1" 1 }
after time 4.0 { tap "down1" 6 }
after time 4.6 { tap "down2" 6 }
after time 5.2 { tap "down3" 6 }
after time 5.8 { tap "down4" 6 }
after time 6.4 { shot "after_downs.png" }
after time 7.0 { tap "space_done" 1 }
after time 10.0 { shot "after_space.png"; close $f; exit }
