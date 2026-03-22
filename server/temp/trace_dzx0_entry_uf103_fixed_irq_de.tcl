set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/uf103_fixed_irq_de.rom"
set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/trace_dzx0_entry_uf103_fixed_irq_de.log"

proc logline {msg} {
    global __log
    set fh [open $__log a]
    puts $fh $msg
    close $fh
}

proc bp_dzx0_entry {} {
    set hl [reg HL]
    set de [reg DE]
    set sp [reg SP]
    logline [format "BP dzx0_standard HL=%04X DE=%04X SP=%04X IFF=%02X" $hl $de $sp [reg IFF]]
    logline [format "SLOTS page0=%s page1=%s page2=%s page3=%s" \
        [get_selected_slot 0] [get_selected_slot 1] [get_selected_slot 2] [get_selected_slot 3]]
    logline [format "BYTES_HL %s" [debug disasm $hl]]
    quit
}

file delete -force $__log
logline "TRACE: loading ROM"

if {[catch {carta $__rom} err]} {
    logline "TRACE ERROR: failed to load ROM: $err"
    quit
}

debug set_bp 0x40B4 {} bp_dzx0_entry
debug cont
