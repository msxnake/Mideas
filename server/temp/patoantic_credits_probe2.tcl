set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic_credits_probe_shots2"
file mkdir $shot_dir
set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic_credits_probe2.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc safe {tag body} { logline "RUN $tag"; if {[catch {uplevel 1 $body} err]} { logline "ERR $tag $err" } }
proc shot {name} { global shot_dir; if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $name $err" } else { logline "SHOTOK $name" } }
proc down_space {} { keymatrixdown 8 0x01 }
proc up_space {} { keymatrixup 8 0x01 }
proc down_down {} { keymatrixdown 8 0x40 }
proc up_down {} { keymatrixup 8 0x40 }
proc tap_space {} { down_space; after time 0.25 up_space }
proc tap_down {} { down_down; after time 0.35 up_down }
after time 7.5 { safe t75 {shot "01_title.png"} }
after time 8.0 { safe sp1 {tap_space} }
after time 8.8 { safe t88 {shot "02_submenu.png"} }
after time 9.2 { safe down {tap_down} }
after time 10.0 { safe t100 {shot "03_credits_selected.png"} }
after time 10.4 { safe sp2 {tap_space} }
after time 11.5 { safe t115 {shot "04_credits_screen.png"} }
after time 12.4 { safe sp3 {tap_space} }
after time 14.0 { safe t140 {shot "05_after_exit.png"} }
after time 17.0 { safe t170 {shot "06_after_wait.png"}; close $f; exit }
