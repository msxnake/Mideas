set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_irq_ram_probe.log"
set f [open $log_path "w"]
set irq_entry_hits 0
set irq_dispatch_hits 0
set irq_exit_hits 0

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC11D]
    set p2 [mem8 0xC11E]
    set p3 [mem8 0xC11F]
    set p4 [mem8 0xC120]
    set saved [mem8 0xC2A4]
    set m4010 [mem8 0x4010]
    set m49be [mem8 0x49C1]
    set m6000 [mem8 0x6000]
    set m8000 [mem8 0x8000]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X/%02X irqSaved=%02X mem4010=%02X mem49C1=%02X mem6000=%02X mem8000=%02X" $tag $pc $sp $p1 $p2 $p3 $p4 $saved $m4010 $m49be $m6000 $m8000]
}

debug set_bp 0x4010 {} {
    state "BP_4010"
    debug cont
}

debug set_bp 0xC219 {} {
    global irq_entry_hits
    incr irq_entry_hits
    if {$irq_entry_hits <= 20} {
        state "BP_IRQ_ENTRY_RAM"
    }
    debug cont
}

debug set_bp 0x49C1 {} {
    global irq_dispatch_hits
    incr irq_dispatch_hits
    if {$irq_dispatch_hits <= 20} {
        state "BP_INTERRUPT_DISPATCHER"
    }
    debug cont
}

debug set_bp 0xC259 {} {
    global irq_exit_hits
    incr irq_exit_hits
    if {$irq_exit_hits <= 20} {
        state "BP_IRQ_EXIT_RAM"
    }
    debug cont
}

after time 8.0 {
    state "FINAL"
    global f irq_entry_hits irq_dispatch_hits irq_exit_hits
    logline [format "COUNTS entry=%d dispatcher=%d exit=%d" $irq_entry_hits $irq_dispatch_hits $irq_exit_hits]
    close $f
    exit
}
