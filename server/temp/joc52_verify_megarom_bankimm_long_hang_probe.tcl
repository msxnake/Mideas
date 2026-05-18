set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_megarom_bankimm_long_hang_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_bankimm_long_hang_shots"
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

proc pcbytes {pc} {
    set out ""
    for {set i 0} {$i < 8} {incr i} {
        set b [mem8 [expr {$pc + $i}]]
        append out [format "%02X" $b]
        if {$i < 7} { append out " " }
    }
    return $out
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set af [reg AF]
    set bc [reg BC]
    set de [reg DE]
    set hl [reg HL]
    set p1 [mem8 0xC11B]
    set p2 [mem8 0xC11C]
    set p3 [mem8 0xC11D]
    set p4 [mem8 0xC11E]
    set flow [mem8 0xC104]
    set exit [mem8 0xC106]
    set screen [mem8 0xE531]
    set irq [mem16 0xE606]
    set lastirq [mem8 0xD76C]
    set secframes [mem8 0xD76B]
    set time0 [mem8 0xC111]
    set time1 [mem8 0xC112]
    set player [mem8 0xDFB2]
    set px [mem16 0xDFAE]
    set py [mem16 0xDFB0]
    set vx [mem8 0xDFB4]
    set vy [mem8 0xDFB5]
    set boss [mem8 0xC015]
    set bx [mem8 0xC021]
    set by [mem8 0xC022]
    set bt [mem8 0xC037]
    set bbt [mem8 0xC032]
    set bstep [mem8 0xC035]
    set st0 [mem16 $sp]
    set st1 [mem16 [expr {$sp + 2}]]
    set bytes [pcbytes $pc]
    logline [format "%s pc=%04X sp=%04X af=%04X bc=%04X de=%04X hl=%04X banks=%02X/%02X/%02X/%02X flow=%02X exit=%02X screen=%02X irq=%04X last=%02X secfr=%02X time=%02X%02X player=%02X pxy=%d,%d v=%02X/%02X boss=%02X bossxy=%02X,%02X bt=%02X bbeh=%02X bstep=%02X stack=%04X,%04X bytes=%s" $tag $pc $sp $af $bc $de $hl $p1 $p2 $p3 $p4 $flow $exit $screen $irq $lastirq $secframes $time1 $time0 $player $px $py $vx $vy $boss $bx $by $bt $bbt $bstep $st0 $st1 $bytes]
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

after time 12.8 { shot "t12_8_game_start" "t12_8" }
after time 14.0 { state "t14" }
after time 15.0 { state "t15" }
after time 16.0 { state "t16" }
after time 17.0 { state "t17" }
after time 18.0 { state "t18" }
after time 19.0 { state "t19" }
after time 20.0 { state "t20" }
after time 21.0 { state "t21" }
after time 22.0 { shot "t22" "t22" }
after time 23.0 { state "t23" }
after time 24.0 { shot "t24_near_time40" "t24" }
after time 25.0 { shot "t25_time40" "t25" }
after time 26.0 { shot "t26_after_time40" "t26" }
after time 27.0 { state "t27" }
after time 28.0 { state "t28" }
after time 29.0 { state "t29" }
after time 30.0 { shot "t30" "t30" }
after time 32.0 { state "t32" }
after time 34.0 { state "t34" }
after time 36.0 { shot "t36" "t36" }
after time 38.0 { state "t38" }
after time 40.0 { shot "t40" "t40"; close $f; exit }

