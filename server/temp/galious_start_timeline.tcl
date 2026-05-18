set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_start_timeline.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_start_shots"
file mkdir $shot_dir
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc shot {sec} {
    global shot_dir
    set pc [reg PC]
    logline [format "SHOT t=%s pc=%04X" $sec $pc]
    if {[catch {screenshot "$shot_dir/galious_start_t${sec}.png"} err]} { logline "SHOTERR $err" }
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {} { down 1; after time 0.25 { up 1 } }
after time 11.8 { logline "TAP_SPACE"; tap_space }
for {set t 10} {$t <= 70} {incr t} { after time $t [list shot $t] }
after time 72 { logline "DONE"; close $f; exit }
