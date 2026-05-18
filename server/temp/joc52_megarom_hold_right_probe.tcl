set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_megarom_hold_right_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_hold_right_shots"
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
    set irq [mem16 0xE606]
    set time0 [mem8 0xC111]
    set player [mem8 0xDFB2]
    set px [mem16 0xDFAE]
    set py [mem16 0xDFB0]
    set vx [mem8 0xDFB4]
    set vy [mem8 0xDFB5]
    set health [mem8 0xDFBB]
    set boss [mem8 0xC015]
    set bx [mem8 0xC021]
    set by [mem8 0xC022]
    set stack0 [mem16 $sp]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X flow=%02X irq=%04X time=%02X player=%02X pxy=%d,%d v=%02X/%02X hp=%02X boss=%02X bossxy=%02X,%02X stack=%04X" $tag $pc $sp $p1 $p2 $p3 $flow $irq $time0 $player $px $py $vx $vy $health $boss $bx $by $stack0]
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
after time 13.0 { down 128; shot "t13_right_start" "t13_right_start" }
after time 15.0 { shot "t15" "t15" }
after time 20.0 { shot "t20" "t20" }
after time 25.0 { shot "t25_time40" "t25" }
after time 30.0 { shot "t30" "t30" }
after time 35.0 { shot "t35" "t35" }
after time 40.0 { shot "t40" "t40" }
after time 45.0 { up 128; shot "t45_release" "t45_release" }
after time 50.0 { shot "t50" "t50"; close $f; exit }
