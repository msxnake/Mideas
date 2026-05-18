set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas122_sm_timer_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas122_sm_timer_probe_shots"
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
    set pc [reg PC]
    set exit [mem8 0xC11E]
    set sel [mem8 0xC11F]
    set ac [mem8 0xC0E7]
    set acop [mem8 0xC0E4]
    set acptr [mem16 0xC0DF]
    set dialog [mem8 0xC0F7]
    set text [mem8 0xC0F9]
    set screen [mem8 0xDF7D]
    set engine [mem8 0xDF7E]
    set world [mem8 0xDF81]
    set smptr [mem16 0xDB1E]
    set smtlo [mem8 0xDB5E]
    set smthi [mem8 0xDB7E]
    set smwait [mem8 0xDB9E]
    logline [format "%s pc=%04X exit=%02X sel=%02X ac=%02X acop=%02X acptr=%04X dialog=%02X text=%02X screen=%02X engine=%02X world=%02X smptr=%04X smt=%02X%02X wait=%02X" $tag $pc $exit $sel $ac $acop $acptr $dialog $text $screen $engine $world $smptr $smthi $smtlo $smwait]
}
proc space_down {} { catch {keymatrixdown 8 1}; catch {keymatrixdown SPACE} }
proc space_up {} { catch {keymatrixup 8 1}; catch {keymatrixup SPACE} }
proc tap_space {tag} {
    state ${tag}_before
    space_down
    after time 0.35 { space_up }
    after time 0.55 [list state ${tag}_after]
}
proc force_done {tag} {
    debug write memory 0xC11F 4
    state ${tag}_forced_done
    tap_space $tag
}
proc shot {name tag} {
    global shot_dir
    state $tag
    screenshot "$shot_dir/$name"
    logline "SHOTOK $name"
}

for {set i 1} {$i <= 75} {incr i} {
    after time [expr {$i * 1.0}] [list state "t${i}"]
}
after time 6.0 { force_done "controls_done1" }
after time 8.0 { force_done "controls_done2" }
foreach t {20 24 28 32 36 40} {
    after time $t [list tap_space "dialog_space$t"]
}
after time 45.0 { shot "t45.png" "shot_t45" }
after time 60.0 { shot "t60.png" "shot_t60" }
after time 72.0 { shot "t72.png" "shot_t72"; close $f; exit }
