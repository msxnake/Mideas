set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_loop_entry_probe.log"
set f [open $log_path "w"]
set loop_hits 0
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
    set screen [mem8 0xC02A]
    set y0 [mem8 0xDEB4]
    set x0 [mem8 0xDE94]
    set lives [mem8 0xC04A]
    set timelo [mem8 0xC04B]
    set timehi [mem8 0xC04C]
    logline [format "%s pc=%04X sp=%04X p=%02X/%02X/%02X flow=%02X exit=%02X screen=%02X x0=%d y0=%d lives=%d time=%02X%02X" $tag $pc $sp $p1 $p2 $p3 $flow $exit $screen $x0 $y0 $lives $timehi $timelo]
}
proc tap_space {tag} {
    logline "${tag}_SPC_DOWN"
    keymatrixdown 8 1
    after time 0.18 { keymatrixup 8 1 }
}
debug set_bp 0xA62B {} {
    global loop_hits
    incr loop_hits
    if {$loop_hits < 12} {
        regs_line [format "BP_loop_%02d" $loop_hits]
    }
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
