set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/vdp_log.txt" w]
proc dump {tag} {
    global log
    puts $log "--- $tag ---"
    if {[catch {set s2 [debug read "VDP status regs" 2]} err]} {
        puts $log "S#2 no legible: $err"
    } else {
        puts $log [format "S#2=%02X (CE=%d)" $s2 [expr {$s2 & 1}]]
    }
    if {[catch {
        set out ""
        foreach r {32 33 34 35 36 37 38 39 40 41 42 43 44 45 46} {
            append out [format "R#%d=%02X " $r [debug read "VDP regs" $r]]
        }
        puts $log $out
    } err]} { puts $log "VDP regs no legibles: $err" }
    puts $log "comp=[debug read memory 0xC0D1] blk=[debug read memory 0xC0D6] pend=[debug read memory 0xC0D2] slot=[debug read memory 0xC0E7]"
    flush $log
}
after time 4.0 { dump "antes-del-traspaso" }
after time 6.0 { dump "colgado" }
after time 6.5 { close $log; exit }
