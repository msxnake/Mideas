set trace_log "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/patoantic246_bank_watch.log"

file mkdir "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots"
set trace_fp [open $trace_log "w"]
set log_count 0

proc trace_log_line {msg} {
    global trace_fp
    puts $trace_fp $msg
    flush $trace_fp
}

proc limited_log {msg} {
    global log_count
    incr log_count
    if {$log_count <= 40} {
        trace_log_line $msg
    }
}

trace_log_line "bank watch loaded"

debug set_watchpoint write_mem 0xC029 {} {
    limited_log [format "wdescbank value=%02X PC=%04X SP=%04X A=%02X HL=%04X" $::wp_last_value [reg PC] [reg SP] [reg A] [reg HL]]
}

debug set_watchpoint write_mem 0xC01D {} {
    limited_log [format "wp2cur   value=%02X PC=%04X SP=%04X A=%02X HL=%04X" $::wp_last_value [reg PC] [reg SP] [reg A] [reg HL]]
}

debug set_bp 0x3989 {} {
    limited_log [format "res_copy_vram PC=%04X SP=%04X A=%02X BC=%04X DE=%04X HL=%04X descId=%02X descBank=%02X" \
        [reg PC] [reg SP] [reg A] [reg BC] [reg DE] [reg HL] [peek 0xC026] [peek 0xC029]]
}

debug set_bp 0x4175 {} {
    limited_log [format "mapper_set_p2 PC=%04X SP=%04X A=%02X BC=%04X DE=%04X HL=%04X" \
        [reg PC] [reg SP] [reg A] [reg BC] [reg DE] [reg HL]]
}

after realtime 10 {
    trace_log_line [format "final PC=%04X SP=%04X AF=%04X P1=%02X P2=%02X P3=%02X descId=%02X descBank=%02X" \
        [reg PC] [reg SP] [reg AF] [peek 0xC01C] [peek 0xC01D] [peek 0xC01E] [peek 0xC026] [peek 0xC029]]
    trace_log_line "bank watch finished"
    close $trace_fp
    exit
}
