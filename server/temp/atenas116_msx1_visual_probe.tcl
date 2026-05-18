set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas116_msx1_visual_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas116_msx1_visual_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc state {tag} {
    set pc [reg PC]
    set exit [mem8 0xC11E]
    set dialog [mem8 0xC0F7]
    set text [mem8 0xC0F9]
    set screen [mem8 0xDF7D]
    set engine [mem8 0xDF7E]
    set world [mem8 0xDF81]
    set sidx [mem8 0xDF82]
    set tilebank [mem8 0xDFBD]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set px [mem16 0xDF87]
    set py [mem16 0xDF89]
    logline [format "%s pc=%04X banks=%02X/%02X/%02X exit=%02X dialog=%02X text=%02X screen=%02X engine=%02X world=%02X idx=%02X tilebank=%02X pxy=%d,%d" $tag $pc $p1 $p2 $p3 $exit $dialog $text $screen $engine $world $sidx $tilebank $px $py]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap {tag mask} {
    state ${tag}_before
    down $mask
    after time 0.16 [list up $mask]
    after time 0.24 [list state ${tag}_after]
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

for {set i 1} {$i <= 32} {incr i} {
    after time [expr {$i * 1.0}] [list state "t${i}"]
}

after time 2.0 { tap "presentation_space" 1 }
set base 4.0
foreach offset {0.0 0.45 0.90 1.35} {
    after time [expr {$base + $offset}] [list tap "controls_down" 64]
}
after time 6.0 { tap "controls_done" 1 }
after time 10.0 { shot "t10_dialog_enter.png" "shot_t10" }
after time 14.0 { shot "t14_dialog_first_text.png" "shot_t14" }
after time 22.0 { shot "t22_dialog_later.png" "shot_t22" }
after time 30.0 { shot "t30_dialog_final.png" "shot_t30"; close $f; exit }
