set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc51_boss_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc51_boss_probe_shots"
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
    set sp [reg SP]
    set p1 [mem8 0xC11B]
    set p2 [mem8 0xC11C]
    set p3 [mem8 0xC11D]
    set p4 [mem8 0xC11E]
    set flow [mem8 0xC104]
    set screen [mem8 0xE16A]
    set irq [mem16 0xE82C]
    set px [mem16 0xE174]
    set py [mem16 0xE176]
    set bossActive [mem8 0xC015]
    set bossCount [mem8 0xC006]
    set bossX [mem8 0xC021]
    set bossY [mem8 0xC022]
    set bossPrevX [mem8 0xC023]
    set bossPrevY [mem8 0xC024]
    set bossTick [mem8 0xC005]
    set behaviorIndex [mem8 0xC031]
    set behaviorTimer [mem8 0xC032]
    set behaviorDuration [mem8 0xC033]
    set behaviorType [mem8 0xC038]
    set targetType [mem8 0xC039]
    set targetX [mem8 0xC03A]
    set targetY [mem8 0xC03B]
    set visualDirty [mem8 0xC03F]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X player=%d,%d boss active=%02X count=%02X xy=%d,%d prev=%d,%d tick=%02X beh idx=%02X type=%02X timer=%02X/%02X target=%02X:%d,%d dirty=%02X" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $irq $px $py $bossActive $bossCount $bossX $bossY $bossPrevX $bossPrevY $bossTick $behaviorIndex $behaviorType $behaviorTimer $behaviorDuration $targetType $targetX $targetY $visualDirty]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc tap_space {tag} {
    state "${tag}_before"
    down 1
    after time 0.20 [list up 1]
    after time 0.25 [list state "${tag}_after"]
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

debug set_bp 0x4010 {} { state "BP_4010"; debug cont }

after time 7.0 { tap_space "space1" }
after time 9.0 { tap_space "space2" }
after time 11.5 { shot "joc51_boss_t115.png" "t115" }
after time 13.0 { shot "joc51_boss_t130.png" "t130" }
after time 15.0 { shot "joc51_boss_t150.png" "t150" }
after time 17.0 { shot "joc51_boss_t170.png" "t170" }
after time 20.0 { shot "joc51_boss_t200.png" "t200" }
after time 24.0 { shot "joc51_boss_t240.png" "t240"; close $f; exit }
