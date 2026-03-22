set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/uf103_fixed_irq_de.rom"
set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/trace_flow_uf103_fixed_irq_de.log"
set __show_count 0
set __decomp_count 0
set __restore_count 0
set __wait_count 0
set __initsys_count 0

proc logline {msg} {
    global __log
    set fh [open $__log a]
    puts $fh $msg
    close $fh
}

proc bp_show {} {
    global __show_count
    incr __show_count
    logline [format "BP show_presentation_screen count=%d PC=%04X SP=%04X" $__show_count [reg PC] [reg SP]]
    debug cont
}

proc bp_decomp {} {
    global __decomp_count
    incr __decomp_count
    if {$__decomp_count <= 12} {
        logline [format "BP page0_decompress_to_ram count=%d HL=%04X DE=%04X SP=%04X slots=%s/%s/%s/%s" \
            $__decomp_count [reg HL] [reg DE] [reg SP] \
            [get_selected_slot 0] [get_selected_slot 1] [get_selected_slot 2] [get_selected_slot 3]]
    }
    debug cont
}

proc bp_wait {} {
    global __wait_count
    incr __wait_count
    logline [format "BP presentation_wait_for_fire count=%d PC=%04X SP=%04X" $__wait_count [reg PC] [reg SP]]
    debug cont
}

proc bp_restore {} {
    global __restore_count
    incr __restore_count
    if {$__restore_count <= 12} {
        logline [format "BP page0_restore_bios_rom count=%d PC=%04X SP=%04X slots=%s/%s/%s/%s" \
            $__restore_count [reg PC] [reg SP] \
            [get_selected_slot 0] [get_selected_slot 1] [get_selected_slot 2] [get_selected_slot 3]]
    }
    debug cont
}

proc bp_initsys {} {
    global __initsys_count
    incr __initsys_count
    logline [format "BP init_game_systems count=%d PC=%04X SP=%04X" $__initsys_count [reg PC] [reg SP]]
    debug cont
}

proc finish_trace {} {
    global __show_count __decomp_count __restore_count __wait_count __initsys_count
    logline [format "FINAL PC=%04X SP=%04X IFF=%02X AF=%04X BC=%04X DE=%04X HL=%04X" \
        [reg PC] [reg SP] [reg IFF] [reg AF] [reg BC] [reg DE] [reg HL]]
    logline [format "FINAL slots=%s/%s/%s/%s" \
        [get_selected_slot 0] [get_selected_slot 1] [get_selected_slot 2] [get_selected_slot 3]]
    logline [format "COUNTS show=%d decomp=%d restore=%d wait=%d initsys=%d" \
        $__show_count $__decomp_count $__restore_count $__wait_count $__initsys_count]
    logline [format "FINAL disasm=%s" [debug disasm [reg PC]]]
    quit
}

file delete -force $__log
logline "TRACE: loading ROM"

if {[catch {carta $__rom} err]} {
    logline "TRACE ERROR: failed to load ROM: $err"
    quit
}

debug set_bp 0x70C9 {} bp_show
debug set_bp 0xA989 {} bp_decomp
debug set_bp 0xA976 {} bp_restore
debug set_bp 0x70B6 {} bp_wait
debug set_bp 0xA9C1 {} bp_initsys

after time 6000 {
    debug break
    after break finish_trace
}
debug cont
