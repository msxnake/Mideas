set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic_menu_probe_shots"
file mkdir $shot_dir
set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic_menu_probe.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc shot {name} { global shot_dir; if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $name $err" } else { logline "SHOTOK $name" } }
proc down_space {} { keymatrixdown 8 0x01 }
proc up_space {} { keymatrixup 8 0x01 }
proc down_down {} { keymatrixdown 8 0x40 }
proc up_down {} { keymatrixup 8 0x40 }
proc tap_space {} { down_space; after time 0.25 up_space }
proc tap_down {} { down_down; after time 0.35 up_down }
after time 7.5 { shot "t075.png" }
after time 8.0 { tap_space }
after time 8.8 { shot "after_space.png" }
after time 9.2 { tap_down }
after time 10.0 { shot "after_down.png" }
after time 12.0 { shot "after_wait.png"; close $f; exit }
