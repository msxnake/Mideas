set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas116_autocontrol_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas116_autocontrol_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr+1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set pc [reg PC]
    set btn [mem8 0xC002]
    set acact [mem8 0xC0E7]
    set acop [mem8 0xC0E4]
    set acrem [mem8 0xC0E5]
    set acwait [mem8 0xC0E3]
    set acptr [mem16 0xC0DF]
    set did [mem8 0xC0F7]
    set dtxt [mem8 0xC0F9]
    set screen [mem8 0xDF7D]
    set engine [mem8 0xDF7E]
    set exit [mem8 0xC11E]
    logline [format "%s pc=%04X btn=%02X acAct=%02X op=%02X rem=%02X wait=%02X ptr=%04X dialog=%02X text=%02X screen=%02X engine=%02X exit=%02X" $tag $pc $btn $acact $acop $acrem $acwait $acptr $did $dtxt $screen $engine $exit]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap {tag mask} { state ${tag}_before; down $mask; after time 0.16 [list up $mask]; after time 0.24 [list state ${tag}_after] }
proc shot {name tag} { global shot_dir; state $tag; catch {screenshot "$shot_dir/$name"} err; logline "SHOT $name $err" }
for {set i 1} {$i <= 36} {incr i} { after time [expr {$i * 1.0}] [list state "t${i}"] }
after time 2.0 { tap "presentation_space" 1 }
set base 4.0
foreach offset {0.0 0.45 0.90 1.35} { after time [expr {$base + $offset}] [list tap "controls_down" 64] }
after time 6.0 { tap "controls_done" 1 }
foreach t {18 20 22 24 26 28 30 32 34} { after time $t [list tap "dialog_space$t" 1] }
after time 19 { shot "t19.png" "shot_t19" }
after time 25 { shot "t25.png" "shot_t25" }
after time 35 { shot "t35.png" "shot_t35"; close $f; exit }
