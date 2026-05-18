set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc60_ascii16_stack_snapshot.log"
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }

proc state {tag} {
    set pc [reg PC]; set sp [reg SP]
    set p1 [mem8 0xC11B]; set p2 [mem8 0xC11C]; set p3 [mem8 0xC11D]; set p4 [mem8 0xC11E]
    set irq [mem16 0xE7CB]; set inirq [mem8 0xE7D0]
    set words {}
    for {set i 0} {$i < 24} {incr i} {
        set a [expr {$sp + ($i * 2)}]
        lappend words [format "%04X" [mem16 $a]]
    }
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X irq=%04X inirq=%02X stack=%s" $tag $pc $sp $p1 $p2 $p3 $p4 $irq $inirq [join $words ","]]
}

set threshold_hits 0
debug set_condition {[reg SP] < 0xE900} {
    global threshold_hits
    if {$threshold_hits == 0} {
        state "FIRST_SP_BELOW_E900"
        close $::f
        exit
    }
    incr threshold_hits
    debug cont
}

after time 12.0 { state "timeout"; close $f; exit }
