set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas111_hlfix_controls_wait.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas111_hlfix_controls_wait_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC137]
    set p2 [mem8 0xC138]
    set p3 [mem8 0xC139]
    set flow [mem8 0xC11C]
    set selection [mem8 0xC11F]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X flow=%02X sel=%02X" $tag $pc $sp $p1 $p2 $p3 $flow $selection]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} {
    state "${tag}_before"
    down 1
    after time 0.20 [list up 1]
    after time 0.30 [list state "${tag}_after"]
}
proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} {
        logline "SHOTERR $err"
    } else {
        logline "SHOTOK $name"
    }
}

after time 6.0 { state "pre_space" }
after time 7.0 { tap_space "space_to_controls" }
after time 9.0 { shot "controls_t9.png" "t9" }
after time 12.0 { shot "controls_t12.png" "t12" }
after time 15.0 { shot "controls_t15.png" "t15"; close $f; exit }
