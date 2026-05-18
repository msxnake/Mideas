set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_megarom_until_timeout_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_until_timeout_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} {
    if {[catch {debug read memory $addr} v]} { return -1 }
    return $v
}

proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    if {$lo < 0 || $hi < 0} { return -1 }
    return [expr {$lo | ($hi << 8)}]
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC11B]
    set p2 [mem8 0xC11C]
    set p3 [mem8 0xC11D]
    set flow [mem8 0xC104]
    set exit [mem8 0xC106]
    set irq [mem16 0xE606]
    set time0 [mem8 0xC111]
    set time1 [mem8 0xC112]
    set player [mem8 0xDFB2]
    set px [mem16 0xDFAE]
    set py [mem16 0xDFB0]
    set boss [mem8 0xC015]
    set bx [mem8 0xC021]
    set by [mem8 0xC022]
    set bbeh [mem8 0xC032]
    set bstep [mem8 0xC035]
    set stack0 [mem16 $sp]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X flow=%02X exit=%02X irq=%04X time=%02X%02X player=%02X pxy=%d,%d boss=%02X bossxy=%02X,%02X bbeh=%02X bstep=%02X stack=%04X" $tag $pc $sp $p1 $p2 $p3 $flow $exit $irq $time1 $time0 $player $px $py $boss $bx $by $bbeh $bstep $stack0]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc tap_space {tag} {
    state ${tag}_before
    down 1
    after time 0.22 [list up 1]
    after time 0.25 [list state ${tag}_after]
}

proc shot {name tag} {
    global shot_dir
    state $tag
    set path "$shot_dir/$name.png"
    if {[catch {screenshot $path} err]} {
        logline "SHOTERR $path $err"
    } else {
        logline "SHOTOK $path"
    }
}

debug set_bp 0x4010 {} {
    state "BP_4010_RESET_OR_INIT"
    debug cont
}

after time 7.0  { tap_space "intro_space" }
after time 12.0 { tap_space "start_space" }
after time 13.0 { shot "t13_start" "t13" }
after time 20.0 { shot "t20_time45" "t20" }
after time 25.0 { shot "t25_time40" "t25" }
after time 30.0 { shot "t30_time35" "t30" }
after time 35.0 { shot "t35_time30" "t35" }
after time 40.0 { shot "t40_time25" "t40" }
after time 45.0 { shot "t45_time20" "t45" }
after time 50.0 { shot "t50_time15" "t50" }
after time 53.0 { shot "t53_time12" "t53" }
after time 55.0 { shot "t55_time10" "t55" }
after time 60.0 { shot "t60_time05" "t60" }
after time 65.0 { shot "t65_timeout" "t65" }
after time 70.0 { shot "t70_after_timeout" "t70"; close $f; exit }
