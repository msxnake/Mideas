set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc60_ascii16_stack_threshold.log"
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }

proc state {tag} {
    set pc [reg PC]; set sp [reg SP]
    set p1 [mem8 0xC11B]; set p2 [mem8 0xC11C]; set p3 [mem8 0xC11D]; set p4 [mem8 0xC11E]
    set flow [mem8 0xC104]; set screen [mem8 0xE129]; set irq [mem16 0xE7CB]; set inirq [mem8 0xE7D0]
    set old0 [mem8 0xE7C6]; set old1 [mem8 0xE7C7]; set old2 [mem8 0xE7C8]
    set stack0 [mem16 $sp]
    set stack1 [mem16 [expr {$sp + 2}]]
    logline [format "%s pc=%04X sp=%04X stack=%04X/%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X inirq=%02X old=%02X%02X%02X" $tag $pc $sp $stack0 $stack1 $p1 $p2 $p3 $p4 $flow $screen $irq $inirq $old0 $old1 $old2]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state "${tag}_before"; down 1; after time 0.20 [list up 1]; after time 0.25 [list state "${tag}_after"] }

set threshold_hits 0
debug set_condition {[reg SP] < 0xE900} {
    global threshold_hits
    if {$threshold_hits < 20} { state "SP_BELOW_E900" }
    incr threshold_hits
    debug cont
}

after time 4.0 { state "t4" }
after time 7.0 { tap_space "space1" }
after time 9.0 { tap_space "space2" }
after time 12.0 {
    state "t12"
    global threshold_hits
    logline [format "threshold_hits=%d" $threshold_hits]
    close $f
    exit
}
