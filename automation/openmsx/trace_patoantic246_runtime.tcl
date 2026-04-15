set trace_file "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/patoantic246_runtime_trace.log"
set screenshot_file "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/patoantic246_runtime_trace.png"
set sym_file "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic246_screen_cache_verify_test_openmsx.sym"

file mkdir "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots"
set trace_fp [open $trace_file "w"]
array set bp_hits {}

proc trace_log {msg} {
    global trace_fp
    puts $trace_fp $msg
    flush $trace_fp
    puts $msg
}

proc trace_dump_state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set af [reg AF]
    set bc [reg BC]
    set de [reg DE]
    set hl [reg HL]
    set r0 [debug read "VDP_REG 0"]
    set r1 [debug read "VDP_REG 1"]
    set p1 [peek 0xC01C]
    set p2 [peek 0xC01D]
    set p3 [peek 0xC01E]
    set irq_enabled [peek 0xDE45]
    set irq_lo [peek 0xDE46]
    set irq_hi [peek 0xDE47]
    trace_log [format "%s PC=%04X SP=%04X AF=%04X BC=%04X DE=%04X HL=%04X R0=%02X R1=%02X P1=%02X P2=%02X P3=%02X IRQEN=%02X IRQCNT=%02X%02X" $tag $pc $sp $af $bc $de $hl $r0 $r1 $p1 $p2 $p3 $irq_enabled $irq_hi $irq_lo]
}

proc trace_bp {name} {
    global bp_hits
    if {![info exists bp_hits($name)]} {
        set bp_hits($name) 0
    }
    incr bp_hits($name)
    if {$bp_hits($name) <= 4} {
        trace_dump_state "BP:$name#$bp_hits($name)"
    }
    debug cont
}

trace_log "trace script loaded"
if {[file exists $sym_file]} {
    debug load_symbols $sym_file
    trace_log "symbols loaded"
} else {
    trace_log "symbols missing"
}

debug set_bp 0x4010 { trace_bp init_rom }
debug set_bp 0x4022 { trace_bp restart_rom_continue }
debug set_bp 0x47B0 { trace_bp init_interrupt_system }
debug set_bp 0x47F7 { trace_bp interrupt_dispatcher }
debug set_bp 0x4C38 { trace_bp call_task_audio_tick_resident }
debug set_bp 0x8020 { trace_bp task_audio_tick }
debug set_bp 0x8235 { trace_bp music_update }
debug set_bp 0xA008 { trace_bp gameflow_start }

after time 500 { trace_dump_state "T+0.5s" }
after time 2000 { trace_dump_state "T+2.0s" }
after time 8000 { trace_dump_state "T+8.0s" }
after time 9000 {
    catch {screenshot $screenshot_file}
    trace_log "screenshot requested"
}
after time 11000 {
    trace_log "trace finished"
    close $trace_fp
    exit
}
