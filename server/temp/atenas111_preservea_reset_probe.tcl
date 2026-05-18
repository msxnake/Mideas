set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas111_preservea_reset_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas111_preservea_reset_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]
set boot_hits 0

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
proc boot_bp {} {
    global boot_hits
    incr boot_hits
    state "BP_4010_$boot_hits"
    if {$boot_hits > 1} {
        logline "RESET_SUSPECT extra jump to 4010"
    }
    debug cont
}

debug set_bp 0x4010 {} { boot_bp }

after time 2.0 { state "t2" }
after time 6.0 { state "pre_space" }
after time 7.0 { tap_space "space1" }
after time 8.5 { shot "atenas111_t8_5.png" "t8_5" }
after time 10.0 { tap_space "space2" }
after time 11.5 { shot "atenas111_t11_5.png" "t11_5" }
after time 14.0 { state "final"; close $f; exit }
