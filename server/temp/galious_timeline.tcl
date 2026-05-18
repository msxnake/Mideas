set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_timeline.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_timeline_shots"
file mkdir $shot_dir
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc shot {sec} {
    global shot_dir
    set pc [reg PC]
    logline [format "SHOT t=%s pc=%04X" $sec $pc]
    catch { screenshot "$shot_dir/galious_t${sec}.png" } err
    if {$err ne ""} { logline "SHOTERR $err" }
}
for {set t 1} {$t <= 80} {incr t} {
    after time $t [list shot $t]
}
after time 82 { logline "DONE"; close $f; exit }
