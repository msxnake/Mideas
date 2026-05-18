set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas120_msx2_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas120_msx2_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set pc [reg PC]
    set exit [mem8 0xC11E]
    set dialog [mem8 0xC0F7]
    set text [mem8 0xC0F9]
    set screen [mem8 0xDF7D]
    set engine [mem8 0xDF7E]
    set world [mem8 0xDF81]
    logline [format "%s pc=%04X exit=%02X dialog=%02X text=%02X screen=%02X engine=%02X world=%02X" $tag $pc $exit $dialog $text $screen $engine $world]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap {tag mask} { state ${tag}_before; down $mask; after time 0.35 [list up $mask]; after time 0.45 [list state ${tag}_after] }
proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $name $err" } else { logline "SHOTOK $name" }
}
for {set i 1} {$i <= 31} {incr i} { after time [expr {$i * 1.0}] [list state "t${i}"] }
after time 2.0 { tap "presentation_space" 1 }
set base 4.0
foreach offset {0.0 0.55 1.10 1.65} { after time [expr {$base + $offset}] [list tap "controls_down" 64] }
after time 6.5 { tap "controls_done" 1 }
foreach t {20 23 26 29} { after time $t [list tap "dialog_space$t" 1] }
after time 18.0 { shot "t18_dialog_start.png" "shot_t18" }
after time 30.0 { shot "t30_dialog_mid.png" "shot_t30"; close $f; exit }
