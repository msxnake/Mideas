set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/uf104.rom"
set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/trace_font_vram_uf104.log"

proc logline {msg} {
    global __log
    set fh [open $__log a]
    puts $fh $msg
    close $fh
}

proc dump_char {label charcode} {
    set base [expr {$charcode * 8}]
    set p0 {}
    set p1 {}
    set p2 {}
    set c0 {}
    set c1 {}
    set c2 {}
    for {set i 0} {$i < 8} {incr i} {
        lappend p0 [format "%02X" [vpeek [expr {$base + $i}]]]
        lappend p1 [format "%02X" [vpeek [expr {0x0800 + $base + $i}]]]
        lappend p2 [format "%02X" [vpeek [expr {0x1000 + $base + $i}]]]
        lappend c0 [format "%02X" [vpeek [expr {0x2000 + $base + $i}]]]
        lappend c1 [format "%02X" [vpeek [expr {0x2800 + $base + $i}]]]
        lappend c2 [format "%02X" [vpeek [expr {0x3000 + $base + $i}]]]
    }
    logline [format "CHAR %s (%d) PAT0=%s PAT1=%s PAT2=%s" $label $charcode [join $p0 " "] [join $p1 " "] [join $p2 " "]]
    logline [format "CHAR %s (%d) COL0=%s COL1=%s COL2=%s" $label $charcode [join $c0 " "] [join $c1 " "] [join $c2 " "]]
}

file delete -force $__log
logline "TRACE: loading ROM"
if {[catch {carta $__rom} err]} {
    logline "TRACE ERROR: failed to load ROM: $err"
    quit
}

after time 8000 {
    logline [format "PC=%04X SP=%04X IFF=%02X" [reg PC] [reg SP] [reg IFF]]
    dump_char "S" 83
    dump_char "T" 84
    dump_char "U" 85
    if {[catch {screenshot "C:/Users/salam/Documents/Programacion/Mideas/server/temp/uf104_fontcheck.png"} serr]} {
        logline "SCREENSHOT ERROR: $serr"
    }
    quit
}
vwait __forever
