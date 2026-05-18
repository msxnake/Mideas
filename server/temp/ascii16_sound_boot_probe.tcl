set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_sound_boot_probe.log"
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
    set far_bank [mem8 0xC219]
    set far_old [mem8 0xC21A]
    set far_addr [mem16 0xC21B]
    logline [format "%s pc=%04X sp=%04X af=%04X bc=%04X de=%04X hl=%04X bank=%02X/%02X/%02X/%02X far=%02X old=%02X addr=%04X" $tag $pc $sp $af $bc $de $hl $p1 $p2 $p3 $p4 $far_bank $far_old $far_addr]
}

proc counted_bp {tag limit} {
    global bp_hits
    if {![info exists bp_hits($tag)]} { set bp_hits($tag) 0 }
    incr bp_hits($tag)
    if {$bp_hits($tag) <= $limit} { state [format "BP_%s_%02d" $tag $bp_hits($tag)] }
    debug cont
}

debug set_bp 0x4010 {} { counted_bp "4010_INIT" 4 }
debug set_bp 0x4F31 {} { counted_bp "4F31_INIT_SOUND_FAR" 8 }
debug set_bp 0x4F43 {} { counted_bp "4F43_INIT_SOUND_RET" 8 }
debug set_bp 0xC139 {} { counted_bp "C139_FARCALL_RAM" 24 }
debug set_bp 0xC160 {} { counted_bp "C160_FARCALL_RETURN" 24 }
debug set_bp 0x6000 {} { counted_bp "6000_P1_ENTRY" 24 }
debug set_bp 0x619F {} { counted_bp "619F_MUSIC_INIT" 8 }
debug set_bp 0x6081 {} { counted_bp "6081_SFX_SILENCE" 8 }
debug set_bp 0x0090 {} { counted_bp "0090_GICINI" 12 }
debug set_bp 0x0093 {} { counted_bp "0093_WRTPSG" 24 }
debug set_bp 0x4D65 {} { counted_bp "4D65_GAMEFLOW_INIT_FAR" 8 }
debug set_bp 0x4D79 {} { counted_bp "4D79_GAMEFLOW_START_FAR" 8 }
debug set_bp 0x0000 {} { counted_bp "0000_TRAP" 8 }

after time 1.0 { state "t1_0" }
after time 2.0 { state "t2_0" }
after time 4.0 { state "t4_0" }
after time 6.0 { state "t6_0"; close $f; exit }
