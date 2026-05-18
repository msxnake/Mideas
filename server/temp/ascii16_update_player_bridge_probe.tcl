set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_update_player_bridge_probe.log"
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
    set px [mem16 0xE191]
    set py [mem16 0xE193]
    set active [mem8 0xE746]
    set firstActive [mem8 0xE726]
    set irq [mem16 0xE829]
    set op0 [mem8 $pc]
    set op1 [mem8 [expr {$pc + 1}]]
    set op2 [mem8 [expr {$pc + 2}]]
    logline [format "%s pc=%04X op=%02X%02X%02X sp=%04X stack=%04X/%04X p=%02X/%02X/%02X tgt=%04X irq=%d active=%02X first=%02X player=%02X xy=%d,%d" $tag $pc $op0 $op1 $op2 $sp $stack0 $stack1 $p1 $p2 $p3 $tgt $irq $active $firstActive $player $px $py]
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

debug set_bp 0x6C49 {} {
    state "BP_A16R8_UPDATE_PLAYER"
    debug cont
}

foreach {addr name} {
    0x6C53 call_check_world_screen_transition
    0x6C63 update_all_entities
    0x6C73 refresh_player_deadly
    0x6C83 refresh_player_tile_interaction
    0x6C93 refresh_player_state_machine
    0x6CA3 execute_all_state_machines
    0x6CB3 refresh_player_wallgrab
    0x6CC3 update_wallgrab_component
    0x6CD3 call_sfx_update
    0x6CE3 refresh_player_animation
} {
    debug set_bp $addr {} [list state "BP_$name"; debug cont]
}

debug set_bp 0x7AB0 {} {
    state "BP_UPDATE_PLAYER_ENTRY"
    debug cont
}

foreach {addr name} {
    0x78E6 ensure_player_fast_runtime_bound
    0x7978 update_entity_ladder_state_c
    0x6BBD aircontrol_should_lock_horizontal_c
    0x69CF update_entity_patrol_facing
    0x79C3 player_fast_dash_process_c
    0x6BC5 walljump_process_entity_c
    0x6A8F component_trigger_edge_pressed_a
    0x6BC2 wallgrab_process_entity_c
    0x7922 sync_player_runtime_from_entity
} {
    debug set_bp $addr {} [list state "BP_$name"; debug cont]
}

debug set_bp 0xC1F5 {} {
    global resident_ret_count
    set tgt [mem16 0xC2BD]
    if {$tgt == 0x7AB0 || $resident_ret_count < 8} {
        state "BP_RESIDENT_RET_AFTER_RESTORE"
    }
    incr resident_ret_count
    debug cont
}

debug set_bp 0xC1E1 {} {
    set tgt [mem16 0xC2BD]
    state "BP_RESIDENT_RET_FROM_TARGET"
    debug cont
}

after time 7.0  { tap_space "SPC1" }
after time 12.0 { tap_space "SPC2" }
after time 16.0 {
    state "FINAL"
    logline [format "resident_ret_count=%d" $resident_ret_count]
    close $f
    exit
}
