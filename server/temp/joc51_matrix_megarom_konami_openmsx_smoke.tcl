set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc51_matrix_megarom_konami_openmsx_smoke.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc51_matrix_megarom_konami_openmsx_smoke_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set pc [reg PC]; set sp [reg SP]
    set p1 [mem8 0xC13C]; set p2 [mem8 0xC13D]; set p3 [mem8 0xC13E]; set p4 [mem8 0xC13F]
    set flow [mem8 0xC11C]; set screen [mem8 0xE26B]; set irq [mem16 0xE92D]; set inirq [mem8 0xE932]
    set px [mem16 0xE275]; set py [mem16 0xE277]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X inirq=%02X pos=%d,%d" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $irq $inirq $px $py]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state "${tag}_before"; down 1; after time 0.20 [list up 1]; after time 0.25 [list state "${tag}_after"] }
proc hold_right {tag duration} { state "${tag}_before"; down 128; after time $duration [list up 128]; after time [expr {$duration + 0.05}] [list state "${tag}_after"] }
proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $err" } else { logline "SHOTOK $name" }
}

debug set_bp 0x4010 {} { state "BP_4010"; debug cont }

after time 7.0 { tap_space "space1" }
after time 9.0 { tap_space "space2" }
after time 12.0 { shot "joc51_matrix_megarom_konami_t12.png" "t12" }
after time 13.5 { hold_right "right" 1.0 }
after time 16.0 { shot "joc51_matrix_megarom_konami_t16.png" "t16" }
after time 22.0 { shot "joc51_matrix_megarom_konami_t22.png" "t22"; close $f; exit }
