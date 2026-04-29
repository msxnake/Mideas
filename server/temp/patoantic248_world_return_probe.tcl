set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_world_return_probe.log"
set f [open $log_path "w"]
proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}
proc mem8 {addr} { return [debug read memory $addr] }
proc regs_line {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set flow [mem8 0xC03B]
    set exit [mem8 0xC03D]
    set goal [mem8 0xC046]
    set lives [mem8 0xC04A]
    set timelo [mem8 0xC04B]
    set timehi [mem8 0xC04C]
    set retlo [mem8 $sp]
    set rethi [mem8 [expr {$sp + 1}]]
    logline [format "%s pc=%04X sp=%04X ret=%02X%02X p=%02X/%02X/%02X flow=%02X exit=%02X goal=%02X lives=%d time=%02X%02X" $tag $pc $sp $rethi $retlo $p1 $p2 $p3 $flow $exit $goal $lives $timehi $timelo]
}
proc tap_space {tag} {
    logline "${tag}_SPC_DOWN"
    keymatrixdown 8 1
    after time 0.18 { keymatrixup 8 1 }
}
debug set_bp 0xA536 {} {
    regs_line "BP_before_world_loop_call"
    debug cont
}
debug set_bp 0xA539 {} {
    regs_line "BP_after_world_loop_return"
    debug cont
}
debug set_bp 0xA543 {} {
    regs_line "BP_ifthenelse"
    debug cont
}
debug set_bp 0xA056 {} {
    regs_line "BP_handle_text"
    debug cont
}
debug set_bp 0xA067 {} {
    regs_line "BP_show_text"
    debug cont
}
debug set_watchpoint write_mem 0xC03D {} {
    regs_line [format "WP_exit_write_%02X" $::wp_last_value]
    debug cont
}
debug set_bp 0x0000 {} {
    regs_line "BP_0000"
    debug cont
}
after time 7.0 { tap_space "first" }
after time 9.2 { tap_space "second" }
after time 15.0 {
    regs_line "at_15s"
    close $f
    exit
}
