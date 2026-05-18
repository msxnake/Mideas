set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas119_msx1_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas119_msx1_probe_shots"
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
    set p1 [mem8 0xC137]
    set p2 [mem8 0xC138]
    set p3 [mem8 0xC139]
    set btn [mem8 0xC002]
    set exit [mem8 0xC11E]
    set acact [mem8 0xC0E7]
    set acop [mem8 0xC0E4]
    set acwait [mem8 0xC0E3]
    set dialog [mem8 0xC0F7]
    set text [mem8 0xC0F9]
    set screen [mem8 0xDF7D]
    set engine [mem8 0xDF7E]
    set world [mem8 0xDF81]
    set tilebank [mem8 0xC151]
    set px [mem16 0xDF87]
    set py [mem16 0xDF89]
    logline [format "%s pc=%04X banks=%02X/%02X/%02X btn=%02X exit=%02X ac=%02X op=%02X wait=%02X dialog=%02X text=%02X screen=%02X engine=%02X world=%02X tilebank=%02X pxy=%d,%d" $tag $pc $p1 $p2 $p3 $btn $exit $acact $acop $acwait $dialog $text $screen $engine $world $tilebank $px $py]
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

for {set i 1} {$i <= 75} {incr i} {
    after time [expr {$i * 1.0}] [list state "t${i}"]
}

after time 2.0 { tap "presentation_space" 1 }
set base 4.0
foreach offset {0.0 0.55 1.10 1.65} {
    after time [expr {$base + $offset}] [list tap "controls_down" 64]
}
after time 6.5 { tap "controls_done" 1 }
foreach t {20 23 26 29 32 35 38 41 44 47 50 53 56 59 62 65 68} {
    after time $t [list tap "dialog_space$t" 1]
}
after time 18.0 { shot "t18_dialog_start.png" "shot_t18" }
after time 30.0 { shot "t30_dialog_mid.png" "shot_t30" }
after time 45.0 { shot "t45_after_lines.png" "shot_t45" }
after time 60.0 { shot "t60_after_dialog.png" "shot_t60" }
after time 72.0 { shot "t72_final.png" "shot_t72"; close $f; exit }
