set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/uf103_fixed_mapfix.rom"
set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/trace_page0_restore_uf103_fixed_mapfix.log"

proc logline {msg} {
    global __log
    set fh [open $__log a]
    puts $fh $msg
    close $fh
}

proc bp_restore {} {
    logline [format "HIT page0_restore_bios_rom PC=%04X SP=%04X HL=%04X DE=%04X" [reg PC] [reg SP] [reg HL] [reg DE]]
    logline [format "SLOTS page0=%s page1=%s page2=%s page3=%s" \
        [get_selected_slot 0] [get_selected_slot 1] [get_selected_slot 2] [get_selected_slot 3]]
    quit
}

file delete -force $__log
logline "TRACE: loading ROM"

if {[catch {carta $__rom} err]} {
    logline "TRACE ERROR: failed to load ROM: $err"
    quit
}

debug set_bp 0xA948 {} bp_restore
after time 10000 {
    logline "TIMEOUT: page0_restore_bios_rom not reached"
    quit
}
debug cont
