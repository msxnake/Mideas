set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas121_msx1_quick.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas121_msx1_quick_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc state {tag} {
    logline [format "%s pc=%04X exit=%02X screen=%02X engine=%02X world=%02X" $tag [reg PC] [mem8 0xC11E] [mem8 0xDF7D] [mem8 0xDF7E] [mem8 0xDF81]]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap {tag mask} {
    state ${tag}_before
    down $mask
    after time 0.35 [list up $mask]
    after time 0.45 [list state ${tag}_after]
}
proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} {
        logline "SHOTERR $name $err"
    } else {
        logline "SHOTOK $name"
    }
}

after time 2.0 { tap "presentation_space" 1 }
set base 4.0
foreach offset {0.0 0.55 1.10 1.65} {
    after time [expr {$base + $offset}] [list tap "controls_down" 64]
}
after time 6.5 { tap "controls_done" 1 }
after time 10.0 { shot "t10.png" "shot_t10" }
after time 12.5 { shot "t12_5.png" "shot_t12_5" }
after time 14.0 { shot "t14.png" "shot_t14"; close $f; exit }
