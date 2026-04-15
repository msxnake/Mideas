set trace_log "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/patoantic246_boot_trace.log"

file mkdir "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots"
set trace_fp [open $trace_log "w"]

proc trace_log_line {msg} {
    global trace_fp
    puts $trace_fp $msg
    flush $trace_fp
}

proc trace_hit {name} {
    set pc [reg PC]
    set sp [reg SP]
    set af [reg AF]
    set p1 [peek 0xC01C]
    set p2 [peek 0xC01D]
    set p3 [peek 0xC01E]
    trace_log_line [format "hit %-28s PC=%04X SP=%04X AF=%04X P1=%02X P2=%02X P3=%02X" $name $pc $sp $af $p1 $p2 $p3]
}

trace_log_line "boot trace loaded"

debug set_bp -once 0x4010 {} {trace_hit "init_rom"}
debug set_bp -once 0x4022 {} {trace_hit "restart_rom_continue"}
debug set_bp -once 0x414E {} {trace_hit "mapper_runtime_init"}
debug set_bp -once 0x45FA {} {trace_hit "resource_manager_init"}
debug set_bp -once 0x47B0 {} {trace_hit "init_interrupt_system"}
debug set_bp -once 0x4C57 {} {trace_hit "init_game_systems"}
debug set_bp -once 0xA008 {} {trace_hit "gameflow_start"}
debug set_bp -once 0xA00E {} {trace_hit "gameflow_execute_node"}
debug set_bp -once 0xA036 {} {trace_hit "gameflow_handle_start"}
debug set_bp -once 0xA6A4 {} {trace_hit "start_init"}
debug set_bp -once 0x4BD4 {} {trace_hit "load_patterns_to_vram_far"}
debug set_bp -once 0x4C18 {} {trace_hit "load_colors_to_vram_far"}
debug set_bp -once 0x4B2A {} {trace_hit "init_animated_tiles_far"}
debug set_bp -once 0x4A09 {} {trace_hit "init_entities_far"}
debug set_bp -once 0x4C2C {} {trace_hit "call_init_font_system_resident"}

after realtime 5 {
    trace_log_line [format "final PC=%04X SP=%04X AF=%04X P1=%02X P2=%02X P3=%02X" [reg PC] [reg SP] [reg AF] [peek 0xC01C] [peek 0xC01D] [peek 0xC01E]]
    trace_log_line "boot trace finished"
    close $trace_fp
    exit
}
