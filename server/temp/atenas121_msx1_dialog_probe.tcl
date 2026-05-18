set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas121_msx1_dialog_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas121_msx1_dialog_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}
proc state {tag} {
    logline [format "%s pc=%04X exit=%02X dialog=%02X text=%02X screen=%02X engine=%02X world=%02X pxy=%d,%d" $tag [reg PC] [mem8 0xC11E] [mem8 0xC0F7] [mem8 0xC0F9] [mem8 0xDF7D] [mem8 0xDF7E] [mem8 0xDF81] [mem16 0xDF87] [mem16 0xDF89]]
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

for {set i 1} {$i <= 48} {incr i} {
    after time [expr {$i * 1.0}] [list state "t${i}"]
}

after time 7.0 { tap "presentation_space" 1 }
set base 9.0
foreach offset {0.0 0.65 1.30 1.95} {
    after time [expr {$base + $offset}] [list tap "controls_down" 64]
}
after time 12.2 { tap "controls_done" 1 }
foreach t {24 27 30 33 36 39 42 45} {
    after time $t [list tap "dialog_space$t" 1]
}
after time 19.0 { shot "t19_dialog_start.png" "shot_t19" }
after time 31.0 { shot "t31_dialog_mid.png" "shot_t31" }
after time 46.0 { shot "t46_after_dialog.png" "shot_t46"; close $f; exit }
