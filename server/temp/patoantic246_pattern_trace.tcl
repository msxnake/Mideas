set trace_log "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/patoantic246_pattern_trace.log"

file mkdir "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots"
set trace_fp [open $trace_log "w"]
array set hit_count {}

proc trace_log_line {msg} {
    global trace_fp
    puts $trace_fp $msg
    flush $trace_fp
}

proc bump_hit {name} {
    global hit_count
    if {![info exists hit_count($name)]} {
        set hit_count($name) 0
    }
    incr hit_count($name)
    if {$hit_count($name) <= 4} {
        trace_log_line [format "hit %-24s #%d PC=%04X SP=%04X AF=%04X P1=%02X P2=%02X P3=%02X" \
            $name $hit_count($name) [reg PC] [reg SP] [reg AF] [peek 0xC01C] [peek 0xC01D] [peek 0xC01E]]
    }
}

trace_log_line "pattern trace loaded"

debug set_bp 0x4010 {} {bump_hit "init_rom"}
debug set_bp 0x4BD4 {} {bump_hit "load_patterns_far"}
debug set_bp 0x601B {} {bump_hit "load_patterns"}
debug set_bp 0x6000 {} {bump_hit "load_pat_b0"}
debug set_bp 0x6009 {} {bump_hit "load_pat_b1"}
debug set_bp 0x6012 {} {bump_hit "load_pat_b2"}
debug set_bp 0x4037 {} {bump_hit "res_load_vram"}
debug set_bp 0x4661 {} {bump_hit "res_find"}
debug set_bp 0x3989 {} {bump_hit "res_copy_vram"}
debug set_bp 0x40C6 {} {bump_hit "fast_ldirvm"}
debug set_bp 0x4C18 {} {bump_hit "load_colors_far"}

after realtime 5 {
    global hit_count
    foreach name [lsort [array names hit_count]] {
        trace_log_line [format "count %-24s %d" $name $hit_count($name)]
    }
    trace_log_line [format "final PC=%04X SP=%04X AF=%04X P1=%02X P2=%02X P3=%02X" [reg PC] [reg SP] [reg AF] [peek 0xC01C] [peek 0xC01D] [peek 0xC01E]]
    trace_log_line "pattern trace finished"
    close $trace_fp
    exit
}
