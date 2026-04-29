set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_entity_rebuild_probe.log"
set f [open $log_path "w"]
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
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set flow [mem8 0xC03B]
    set screen [mem8 0xC02A]
    set dirty [mem8 0xE9A7]
    set active_count [mem8 0xE9A5]
    set hero [mem8 0xE9A6]
    set input_count [mem8 0xE9C8]
    set render_count [mem8 0xE9E9]
    set collision_count [mem8 0xEA0A]
    set ground_count [mem8 0xEA2B]
    set anim_count [mem8 0xEA4C]
    set lives [mem8 0xC04A]
    set timelo [mem8 0xC04B]
    set timehi [mem8 0xC04C]
    set op0 [mem8 $pc]
    set op1 [mem8 [expr {$pc + 1}]]
    set op2 [mem8 [expr {$pc + 2}]]
    logline [format "%s pc=%04X op=%02X,%02X,%02X sp=%04X af=%04X bc=%04X de=%04X hl=%04X p=%02X/%02X/%02X flow=%02X screen=%02X dirty=%02X counts=%02X/%02X/%02X/%02X/%02X/%02X hero=%02X lives=%d time=%02X%02X" $tag $pc $op0 $op1 $op2 $sp $af $bc $de $hl $p1 $p2 $p3 $flow $screen $dirty $active_count $input_count $render_count $collision_count $ground_count $anim_count $hero $lives $timehi $timelo]
}

proc step_hit {name} {
    global hit_count
    incr hit_count
    if {$hit_count <= 220} {
        regs_line [format "HIT_%03d_%s" $hit_count $name]
    }
    debug cont
}

proc tap_space {tag} {
    logline "${tag}_SPC_DOWN"
    keymatrixdown 8 1
    after time 0.18 { keymatrixup 8 1 }
}

debug set_bp 0x0000 {} {
    regs_line "BP_0000"
    debug cont
}
debug set_bp 0xA62B {} { step_hit "world_loop_top" }
debug set_bp 0x7861 {} { step_hit "update_all_entities" }
debug set_bp 0x78BF {} { step_hit "ensure_list" }
debug set_bp 0x78C8 {} { step_hit "rebuild_start" }
debug set_bp 0x78E4 {} { step_hit "rebuild_loop" }
debug set_bp 0x77E9 {} { step_hit "entity_job_should_run_c" }
debug set_bp 0x79D0 {} { step_hit "next_entity" }
debug set_bp 0x79D5 {} { step_hit "rebuild_done" }
debug set_bp 0x660F {} { step_hit "update_input_component" }
debug set_bp 0xA0B8 {} { step_hit "update_entities" }

after time 7.0 { tap_space "first" }
after time 9.2 { tap_space "second" }
after time 17.0 {
    regs_line "final"
    close $f
    exit
}
