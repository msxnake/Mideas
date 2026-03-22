set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/uf103_fixed_irq_de.rom"
set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/trace_0038_uf103_fixed_irq_de.log"

proc logline {msg} {
    global __log
    set fh [open $__log a]
    puts $fh $msg
    close $fh
}

proc trace_break_0038 {} {
    global __bp_id
    set pc [reg PC]
    set sp [reg SP]
    set iff [reg IFF]
    set af [reg AF]
    set bc [reg BC]
    set de [reg DE]
    set hl [reg HL]
    set retaddr [peek16 $sp]
    set page0 [get_selected_slot 0]
    set page1 [get_selected_slot 1]
    set page2 [get_selected_slot 2]
    set page3 [get_selected_slot 3]
    set dis0 [debug disasm 0x0038]
    set dis1 [debug disasm [expr {$retaddr & 0xFFFF}]]
    logline [format "BP0038 PC=%04X SP=%04X IFF=%02X AF=%04X BC=%04X DE=%04X HL=%04X RET=%04X" $pc $sp $iff $af $bc $de $hl $retaddr]
    logline [format "SLOTS page0=%s page1=%s page2=%s page3=%s" $page0 $page1 $page2 $page3]
    logline [format "DISASM_0038 %s" $dis0]
    logline [format "DISASM_RET %s" $dis1]
    catch {debug remove_bp $__bp_id}
    quit
}

file delete -force $__log
logline "TRACE: loading ROM"

if {[catch {carta $__rom} err]} {
    logline "TRACE ERROR: failed to load ROM: $err"
    quit
}

set __bp_id [debug set_bp 0x0038 {} trace_break_0038]
after time 15000 {
    logline "TRACE TIMEOUT: no hit at 0038h within 15000 ms"
    quit
}
debug cont
