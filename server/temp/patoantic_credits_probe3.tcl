set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic_credits_probe3_shots"
file mkdir $shot_dir
set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic_credits_probe3.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    logline [format "%s pc=%04X sp=%04X" $tag $pc $sp]
}
proc shot {name} { global shot_dir; state $name; if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $name $err" } else { logline "SHOTOK $name" } }
proc kd {mask} { keymatrixdown 8 $mask }
proc ku {mask} { keymatrixup 8 $mask }
proc tap {tag mask dur} { state "$tag-down"; kd $mask; after time $dur [list release $tag $mask] }
proc release {tag mask} { ku $mask; state "$tag-up" }
after time 7.5 { shot "01_title.png" }
after time 8.0 { tap "space1" 0x01 0.25 }
after time 8.8 { shot "02_submenu.png" }
after time 9.2 { tap "down1" 0x40 0.35 }
after time 10.0 { shot "03_credits_selected.png" }
after time 10.4 { tap "space2" 0x01 0.25 }
after time 11.6 { shot "04_credits_screen.png" }
after time 12.4 { tap "space3" 0x01 0.25 }
after time 14.0 { shot "05_after_exit.png" }
after time 15.0 { tap "space4" 0x01 0.25 }
after time 16.5 { shot "06_after_main_space.png" }
after time 18.0 { shot "07_final.png"; close $f; exit }
