set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_loop_step_probe.log"
set f [open $log_path "w"]
set init_hits 0
set hit_count 0

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }

proc regs_line {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set af [reg AF]
    set bc [reg BC]
    set de [reg DE]
    set hl [reg HL]
    set ix [reg IX]
    set iy [reg IY]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set flow [mem8 0xC03B]
    set exit [mem8 0xC03D]
    set screen [mem8 0xC02A]
    set engine [mem8 0xE42C]
    set lives [mem8 0xC04A]
    set timelo [mem8 0xC04B]
    set timehi [mem8 0xC04C]
    set irqlo [mem8 0xEA88]
    set irqhi [mem8 0xEA89]
    set inirq [mem8 0xEA8D]
    set op0 [mem8 $pc]
    set op1 [mem8 [expr {$pc + 1}]]
    set op2 [mem8 [expr {$pc + 2}]]
    logline [format "%s pc=%04X op=%02X,%02X,%02X sp=%04X af=%04X bc=%04X de=%04X hl=%04X ix=%04X iy=%04X p=%02X/%02X/%02X flow=%02X exit=%02X screen=%02X engine=%02X lives=%d time=%02X%02X irq=%02X%02X inirq=%02X" $tag $pc $op0 $op1 $op2 $sp $af $bc $de $hl $ix $iy $p1 $p2 $p3 $flow $exit $screen $engine $lives $timehi $timelo $irqhi $irqlo $inirq]
}

proc step_hit {name} {
    global hit_count
    incr hit_count
    if {$hit_count <= 160} {
        regs_line [format "STEP_%03d_%s" $hit_count $name]
    }
    debug cont
}

proc tap_space {tag} {
    logline "${tag}_SPC_DOWN"
    keymatrixdown 8 1
    after time 0.18 { keymatrixup 8 1 }
}

debug set_bp 0x4010 {} {
    global init_hits
    incr init_hits
    regs_line [format "BP_init_rom_%d" $init_hits]
    debug cont
}
debug set_bp 0x0000 {} {
    regs_line "BP_0000"
    debug cont
}

debug set_bp 0xA62B {} { step_hit "world_loop_top" }
debug set_bp 0x48CF {} { step_hit "task_update_input" }
debug set_bp 0x7AC2 {} { step_hit "update_player_fastpath" }
debug set_bp 0xA6C6 {} { step_hit "update_world_screen_timer" }
debug set_bp 0x5170 {} { step_hit "call_check_transition_resident" }
debug set_bp 0x4D0E {} { step_hit "check_transition_far" }
debug set_bp 0x7861 {} { step_hit "update_all_entities" }
debug set_bp 0x70D7 {} { step_hit "refresh_deadly" }
debug set_bp 0x7705 {} { step_hit "refresh_tile_interaction" }
debug set_bp 0x7E08 {} { step_hit "refresh_state_machine" }
debug set_bp 0x7DD4 {} { step_hit "execute_all_state_machines" }
debug set_bp 0x6BB4 {} { step_hit "refresh_wallgrab" }
debug set_bp 0x6BB3 {} { step_hit "update_wallgrab_component" }
debug set_bp 0x5194 {} { step_hit "call_sfx_update_resident" }
debug set_bp 0x4EA6 {} { step_hit "sfx_update_far" }
debug set_bp 0x69B2 {} { step_hit "refresh_animation" }
debug set_bp 0x618F {} { step_hit "refresh_sprite" }
debug set_bp 0x51D6 {} { step_hit "call_update_sprites_resident" }
debug set_bp 0x4C18 {} { step_hit "update_sprites_far" }
debug set_bp 0x5217 {} { step_hit "call_update_tiles_resident" }
debug set_bp 0x4F72 {} { step_hit "update_tiles_far" }
debug set_bp 0x5179 {} { step_hit "call_render_hud_resident" }
debug set_bp 0x4FB6 {} { step_hit "render_hud_far" }

after time 7.0 { tap_space "first" }
after time 9.2 { tap_space "second" }
after time 17.0 {
    regs_line "final"
    close $f
    exit
}
