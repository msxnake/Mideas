set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_upper_boot_trace.log"
set f [open $log_path "w"]

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
    set b6000 [mem8 0x6000]
    set b8000 [mem8 0x8000]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X/%02X mem6000=%02X mem8000=%02X" $tag $pc $sp $p1 $p2 $p3 $p4 $b6000 $b8000]
}

debug set_bp 0x4010 {} { state "BP_4010"; debug cont }
debug set_bp 0x4022 {} { state "BP_restart_continue"; debug cont }
debug set_bp 0x417F {} { state "BP_mapper_set_p1"; debug cont }
debug set_bp 0x4191 {} { state "BP_mapper_set_p3"; debug cont }
debug set_bp 0x4B52 {} { state "BP_install_bridge"; debug cont }
debug set_bp 0x49BE {} { state "BP_interrupt_dispatcher"; debug cont }
debug set_bp 0x8DBA {} { state "BP_gameflow_start"; debug cont }
debug set_bp 0x8DA9 {} { state "BP_gameflow_init"; debug cont }

after time 0.5 { reset }
after time 1.0 { state "t1" }
after time 2.0 { state "t2" }
after time 3.0 { state "t3" }
after time 4.0 { state "t4" }
after time 5.0 { state "t5"; close $f; exit }
