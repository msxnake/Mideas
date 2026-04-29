set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_no_irq_audio_probe.log"
set f [open $log_path "w"]
set init_hits 0
proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}
proc mem8 {addr} { return [debug read memory $addr] }
proc poke8 {addr value} { debug write memory $addr $value }
proc regs_line {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set exit [mem8 0xC03D]
    set flow [mem8 0xC03B]
    set engine [mem8 0xE42C]
    set lives [mem8 0xC04A]
    set timelo [mem8 0xC04B]
    set timehi [mem8 0xC04C]
    set task0lo [mem8 0xEA72]
    set task0hi [mem8 0xEA73]
    set irqlo [mem8 0xEA88]
    set irqhi [mem8 0xEA89]
    logline [format "%s pc=%04X sp=%04X p1=%02X p2=%02X p3=%02X exit=%02X flow=%02X engine=%02X lives=%d time=%02X%02X task0=%02X%02X irq=%02X%02X" $tag $pc $sp $p1 $p2 $p3 $exit $flow $engine $lives $timehi $timelo $task0hi $task0lo $irqhi $irqlo]
}
proc tap_space {tag} {
    logline "${tag}_SPC_DOWN"
    keymatrixdown 8 1
    after time 0.18 { keymatrixup 8 1 }
}
proc disable_irq_audio {} {
    poke8 0xEA72 0
    poke8 0xEA73 0
    regs_line "irq_audio_disabled"
}
debug set_bp 0x4010 {} {
    global init_hits
    incr init_hits
    regs_line [format "BP_init_rom_%d" $init_hits]
    debug cont
}
debug set_bp 0x401C {} {
    regs_line "BP_restart_rom"
    debug cont
}
debug set_watchpoint write_mem 0xC03D {} {
    regs_line [format "WP_exit_write_%02X" $::wp_last_value]
    debug cont
}
debug set_watchpoint write_mem 0xC03B {} {
    regs_line [format "WP_flow_write_%02X" $::wp_last_value]
    debug cont
}
after time 7.0 { tap_space "first" }
after time 8.8 { disable_irq_audio }
after time 9.2 { tap_space "second" }
after time 9.7 { regs_line "after_second_500ms" }
after time 12.0 { regs_line "after_second_3s" }
after time 19.0 {
    regs_line "final"
    close $f
    exit
}
