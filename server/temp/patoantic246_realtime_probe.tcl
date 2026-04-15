set probe_log "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/patoantic246_realtime_probe.log"

file mkdir "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots"
set probe_fp [open $probe_log "w"]

proc probe_log_line {msg} {
    global probe_fp
    puts $probe_fp $msg
    flush $probe_fp
}

proc probe_dump {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set af [reg AF]
    set bc [reg BC]
    set de [reg DE]
    set hl [reg HL]
    set p1 [peek 0xC01C]
    set p2 [peek 0xC01D]
    set p3 [peek 0xC01E]
    probe_log_line [format "%s PC=%04X SP=%04X AF=%04X BC=%04X DE=%04X HL=%04X P1=%02X P2=%02X P3=%02X" $tag $pc $sp $af $bc $de $hl $p1 $p2 $p3]
}

proc safe_probe_dump {tag} {
    probe_log_line "callback $tag entered"
    if {[catch {probe_dump $tag} err]} {
        probe_log_line "callback $tag error: $err"
    }
}

probe_log_line "probe loaded"
after realtime 0.5 {
    safe_probe_dump "T+0.5s"
}
after realtime 2 {
    safe_probe_dump "T+2.0s"
}
after realtime 5 {
    safe_probe_dump "T+5.0s"
    probe_log_line "probe finished"
    close $probe_fp
    exit
}
