set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/trace_font_menu_uf104.log"
set __shot "C:/Users/salam/Documents/Programacion/Mideas/server/temp/trace_font_menu_uf104.png"

proc logline {msg} {
    set fh [open $::__log a]
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

proc dump_row {label row} {
    set values {}
    set chars {}
    set base [expr {0x1800 + ($row * 32)}]
    for {set i 0} {$i < 32} {incr i} {
        set value [vpeek [expr {$base + $i}]]
        lappend values [format "%02X" $value]
        if {$value >= 32 && $value < 127} {
            append chars [format "%c" $value]
        } else {
            append chars "."
        }
    }
    logline [format "ROW %s (%d) HEX=%s" $label $row [join $values " "]]
    logline [format "ROW %s (%d) TXT=%s" $label $row $chars]
}

file delete -force $__log
file delete -force $__shot
logline "TRACE: startup"

after time 9000 {
    logline "CALLBACK: enter"
    if {[catch {
        logline [format "PC=%04X SP=%04X" [reg PC] [reg SP]]
        dump_char "I" 73
        dump_char "T" 84
        dump_char "Y" 89
        dump_row "TITLE" 5
        dump_row "OPT0" 10
        dump_row "OPT1" 12
        if {[catch {screenshot $__shot} serr]} {
            logline "SCREENSHOT ERROR: $serr"
        } else {
            logline "SCREENSHOT OK"
        }
    } err]} {
        logline "CALLBACK ERROR: $err"
    }
    logline "CALLBACK: exit"
    exit
}
