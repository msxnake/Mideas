set probe_log "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/patoantic246_probe.log"
set probe_shot "C:/Users/salam/Documents/Programacion/Mideas/automation/openmsx/screenshots/patoantic246_probe.png"

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
    set r0 [debug read "VDP_REG 0"]
    set r1 [debug read "VDP_REG 1"]
    set p1 [peek 0xC01C]
    set p2 [peek 0xC01D]
    set p3 [peek 0xC01E]
    probe_log_line [format "%s PC=%04X SP=%04X AF=%04X R0=%02X R1=%02X P1=%02X P2=%02X P3=%02X" $tag $pc $sp $af $r0 $r1 $p1 $p2 $p3]
}

probe_log_line "probe loaded"
after time 500 { probe_dump "T+0.5s" }
after time 2000 { probe_dump "T+2.0s" }
after time 4000 {
    catch {screenshot $probe_shot}
    probe_log_line "screenshot requested"
}
after time 6000 {
    probe_dump "T+6.0s"
    probe_log_line "probe finished"
    close $probe_fp
    exit
}
