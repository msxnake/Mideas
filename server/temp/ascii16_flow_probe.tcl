set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_flow_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_flow_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]
array set bp_hits {}

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set af [reg AF]
    set bc [reg BC]
    set de [reg DE]
    set hl [reg HL]
    set p1 [mem8 0xC11D]
    set p2 [mem8 0xC11E]
    set p3 [mem8 0xC11F]
    set p4 [mem8 0xC120]
    set flow [mem8 0xC104]
    set screen [mem8 0xE0E6]
    set irq [mem16 0xE788]
    set inirq [mem8 0xE78D]
    set px [mem16 0xE0F0]
    set py [mem16 0xE0F2]
    set far_bank [mem8 0xC219]
    set far_addr [mem16 0xC21B]
    set res_addr [mem16 0xC21D]
    logline [format "%s pc=%04X sp=%04X af=%04X bc=%04X de=%04X hl=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X inirq=%02X pos=%d,%d far=%02X:%04X res=%04X" $tag $pc $sp $af $bc $de $hl $p1 $p2 $p3 $p4 $flow $screen $irq $inirq $px $py $far_bank $far_addr $res_addr]
}

proc counted_bp {tag limit} {
    global bp_hits
    if {![info exists bp_hits($tag)]} {
        set bp_hits($tag) 0
    }
    incr bp_hits($tag)
    if {$bp_hits($tag) <= $limit} {
        state [format "BP_%s_%02d" $tag $bp_hits($tag)]
    }
    debug cont
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc tap_space {tag} {
    state "${tag}_before"
    down 1
    after time 0.20 [list up 1]
    after time 0.30 [list state "${tag}_after"]
}

proc hold_right {tag duration} {
    state "${tag}_before"
    down 128
    after time $duration [list up 128]
    after time [expr {$duration + 0.10}] [list state "${tag}_after"]
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

debug set_bp 0x4010 {} { counted_bp "4010_INIT" 4 }
debug set_bp 0x4D79 {} { counted_bp "4D79_GAMEFLOW_START_FAR" 8 }
debug set_bp 0xC139 {} { counted_bp "C139_FARCALL_RAM" 20 }
debug set_bp 0xC1B9 {} { counted_bp "C1B9_RESCALL_RAM" 20 }
debug set_bp 0x6008 {} { counted_bp "6008_GAMEFLOW_START" 12 }
debug set_bp 0x603B {} { counted_bp "603B_HANDLE_START" 12 }
debug set_bp 0x6590 {} { counted_bp "6590_HANDLE_PRESENTATION" 12 }
debug set_bp 0x65AF {} { counted_bp "65AF_HANDLE_WORLDLINK" 12 }
debug set_bp 0x6AD9 {} { counted_bp "6AD9_RESIDENT_MAPPER_WRAPPER" 20 }
debug set_bp 0x52C0 {} { counted_bp "52C0_INIT_GAME_SYSTEMS" 20 }
debug set_bp 0x407C {} { counted_bp "407C_MAIN_LOOP" 8 }
debug set_bp 0x0000 {} { counted_bp "0000_TRAP" 8 }

after time 1.5 { state "t1_5" }
after time 4.0 { state "t4_0" }
after time 7.0 { tap_space "space1" }
after time 9.0 { tap_space "space2" }
after time 10.0 { state "t10_0" }
after time 12.0 { shot "ascii16_flow_t12.png" "t12_0" }
after time 13.0 { hold_right "right" 1.0 }
after time 14.5 { shot "ascii16_flow_t14_5.png" "t14_5" }
after time 16.0 { state "t16_0"; close $f; exit }
