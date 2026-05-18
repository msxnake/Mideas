set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas116_dialog_probe2.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas116_dialog_probe2_shots"
file mkdir $shot_dir
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr+1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set pc [reg PC]
    set exit [mem8 0xC11E]
    set dialog [mem8 0xC0F7]
    set text [mem8 0xC0F9]
    set screen [mem8 0xDF7D]
    set engine [mem8 0xDF7E]
    set world [mem8 0xDF81]
    set sidx [mem8 0xDF82]
    set px [mem16 0xDF87]
    set py [mem16 0xDF89]
    logline [format "%s pc=%04X exit=%02X dialog=%02X text=%02X screen=%02X engine=%02X world=%02X idx=%02X pxy=%d,%d" $tag $pc $exit $dialog $text $screen $engine $world $sidx $px $py]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap {tag mask} { state ${tag}_before; down $mask; after time 0.16 [list up $mask]; after time 0.24 [list state ${tag}_after] }
proc shot {name tag} { global shot_dir; state $tag; catch {screenshot "$shot_dir/$name"} err; logline "SHOT $name $err" }
# presentation: press SPACE once
for {set i 1} {$i <= 75} {incr i} { after time [expr {$i * 1.0}] [list state "t${i}"] }
after time 2.0 { tap "presentation_space" 1 }
# controls: move selection down to DONE and confirm
set base 4.0
foreach offset {0.0 0.45 0.90 1.35} { after time [expr {$base + $offset}] [list tap "controls_down" 64] }
after time 6.0 { tap "controls_done" 1 }
# dialogue: repeated SPACE presses to advance lines/end
foreach t {10 12 14 16 18 20 22 24 26 28 30 32 34 36 38 40 42 44 46 48 50 52 54 56 58 60 62 64 66 68 70} { after time $t [list tap "dialog_space$t" 1] }
after time 3 { shot "t03_presentation.png" "shot_t03" }
after time 7 { shot "t07_after_controls.png" "shot_t07" }
after time 12 { shot "t12_dialog.png" "shot_t12" }
after time 24 { shot "t24_dialog.png" "shot_t24" }
after time 40 { shot "t40_after_dialog.png" "shot_t40" }
after time 55 { shot "t55_after_dialog.png" "shot_t55" }
after time 72 { shot "t72_final.png" "shot_t72"; close $f; exit }
