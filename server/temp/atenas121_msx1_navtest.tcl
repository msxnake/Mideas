set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas121_msx1_navtest.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas121_msx1_navtest_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc kdown {col} { keymatrixdown 8 $col }
proc kup {col} { keymatrixup 8 $col }
proc tap {tag col} {
    logline [format "%s pc=%04X" $tag [reg PC]]
    kdown $col
    after time 0.25 [list kup $col]
}
proc shot {name} {
    global shot_dir
    screenshot "$shot_dir/$name"
    logline "SHOTOK $name"
}

after time 2.0 { tap "space1" 0 }
after time 4.0 { tap "down1" 6 }
after time 4.6 { tap "down2" 6 }
after time 5.2 { tap "down3" 6 }
after time 5.8 { tap "down4" 6 }
after time 6.4 { shot "after_downs.png" }
after time 7.0 { tap "space_done" 0 }
after time 9.0 { shot "after_space.png"; close $f; exit }
