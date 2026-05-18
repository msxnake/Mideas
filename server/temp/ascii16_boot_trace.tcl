set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_boot_trace.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set pc [reg PC]; set sp [reg SP]
    set p1 [mem8 0xC11D]; set p2 [mem8 0xC11E]; set p3 [mem8 0xC11F]; set p4 [mem8 0xC120]
    set flow [mem8 0xC104]; set screen [mem8 0xE0E6]; set irq [mem16 0xE788]; set inirq [mem8 0xE78D]
    set px [mem16 0xE0F0]; set py [mem16 0xE0F2]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X inirq=%02X pos=%d,%d" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $irq $inirq $px $py]
}
for {set i 0} {$i <= 80} {incr i} {
    set t [expr {$i * 0.25}]
    after time $t [list state "t$i"]
}
after time 20.5 { close $f; exit }
