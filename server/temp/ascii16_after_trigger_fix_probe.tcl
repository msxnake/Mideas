set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_after_trigger_fix_probe.log"
set f [open $log_path "w"]

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
    set p1 [mem8 0xC11D]
    set p2 [mem8 0xC11E]
    set p3 [mem8 0xC11F]
    set tgt [mem16 0xC2BD]
    set stack0 [mem16 $sp]
    set stack1 [mem16 [expr {$sp + 2}]]
    set player [mem8 0xE196]
    set runtime [mem8 0xE195]
    set px [mem16 0xE191]
    set py [mem16 0xE193]
    set active [mem8 0xE746]
    set firstActive [mem8 0xE726]
    set irq [mem16 0xE829]
    set op0 [mem8 $pc]
    set op1 [mem8 [expr {$pc + 1}]]
    set op2 [mem8 [expr {$pc + 2}]]
    logline [format "%s pc=%04X op=%02X%02X%02X sp=%04X stack=%04X/%04X p=%02X/%02X/%02X tgt=%04X irq=%d active=%02X first=%02X player=%02X runtime=%02X xy=%d,%d" $tag $pc $op0 $op1 $op2 $sp $stack0 $stack1 $p1 $p2 $p3 $tgt $irq $active $firstActive $player $runtime $px $py]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} {
    state ${tag}_before
    down 1
    after time 0.22 [list up 1]
    after time 0.25 [list state ${tag}_after]
}

set resident_ret_count 0
set trigger_count 0

debug set_bp 0x4010 {} {
    state "BP_RESET_4010"
    debug cont
}

debug set_bp 0x6BD5 {} {
    state "BP_A16R8_UPDATE_PLAYER"
    debug cont
}

debug set_bp 0x6BF5 {} {
    state "BP_A16R8_UPDATE_ALL_ENTITIES"
    debug cont
}

debug set_bp 0x7759 {} {
    state "BP_UPDATE_ALL_ENTITIES_ENTRY"
    debug cont
}

debug set_bp 0x7AB0 {} {
    state "BP_UPDATE_PLAYER_ENTRY"
    debug cont
}

debug set_bp 0x494C {} {
    global trigger_count
    if {$trigger_count < 12} {
        state "BP_COMPONENT_TRIGGER_EDGE"
    }
    incr trigger_count
    debug cont
}

debug set_bp 0x4992 {} {
    state "BP_COMPONENT_TRIGGER_LEVEL"
    debug cont
}

debug set_bp 0xC1E1 {} {
    global resident_ret_count
    set tgt [mem16 0xC2BD]
    if {$tgt == 0x7AB0 || $tgt == 0x7759 || $resident_ret_count < 12} {
        state "BP_RESIDENT_RET_FROM_TARGET"
    }
    incr resident_ret_count
    debug cont
}

after time 7.0  { tap_space "SPC1" }
after time 12.0 { tap_space "SPC2" }
after time 16.0 {
    state "FINAL"
    logline [format "resident_ret_count=%d trigger_count=%d" $resident_ret_count $trigger_count]
    close $f
    exit
}
