set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_dense_reset_probe.log"
set f [open $log_path "w"]
set init_hits 0
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
    set af [reg AF]
    set bc [reg BC]
    set de [reg DE]
    set hl [reg HL]
    set ix [reg IX]
    set iy [reg IY]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set exit [mem8 0xC03D]
    set flow [mem8 0xC03B]
    set screen [mem8 0xC02A]
    set engine [mem8 0xE42C]
    set lives [mem8 0xC04A]
    set timelo [mem8 0xC04B]
    set timehi [mem8 0xC04C]
    set frames [mem8 0xDCA4]
    set lastlo [mem8 0xDCA5]
    set lasthi [mem8 0xDCA6]
    set irqlo [mem8 0xEA88]
    set irqhi [mem8 0xEA89]
    set op0 [mem8 $pc]
    set op1 [mem8 [expr {$pc + 1}]]
    set op2 [mem8 [expr {$pc + 2}]]
    logline [format "%s pc=%04X op=%02X,%02X,%02X sp=%04X af=%04X bc=%04X de=%04X hl=%04X ix=%04X iy=%04X p=%02X/%02X/%02X flow=%02X exit=%02X screen=%02X engine=%02X lives=%d time=%02X%02X frames=%02X last=%02X%02X irq=%02X%02X" $tag $pc $op0 $op1 $op2 $sp $af $bc $de $hl $ix $iy $p1 $p2 $p3 $flow $exit $screen $engine $lives $timehi $timelo $frames $lasthi $lastlo $irqhi $irqlo]
}
proc tap_space {tag} {
    logline "${tag}_SPC_DOWN"
    keymatrixdown 8 1
    after time 0.18 { keymatrixup 8 1 }
}
proc sample_loop {i max} {
    regs_line [format "dense_%03d" $i]
    if {$i < $max} {
        after time 0.10 [list sample_loop [expr {$i + 1}] $max]
    }
}
debug set_bp 0x0000 {} {
    regs_line "BP_0000"
    debug cont
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
after time 7.0 { tap_space "first" }
after time 9.2 { tap_space "second" }
after time 9.4 { sample_loop 0 90 }
after time 19.0 {
    regs_line "final"
    close $f
    exit
}
