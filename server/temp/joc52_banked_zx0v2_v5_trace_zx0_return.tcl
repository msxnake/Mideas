set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_banked_zx0v2_v5_trace_zx0_return.log"
set f [open $log_path "w"]
set zx0_count 0

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc bytes_at {addr count} {
    set out ""
    for {set i 0} {$i < $count} {incr i} { append out [format "%02X " [mem8 [expr {$addr + $i}]]] }
    return $out
}
proc state {tag} {
    set pc [reg PC]; set sp [reg SP]; set hl [reg HL]; set de [reg DE]; set bc [reg BC]; set a [reg A]
    set p1 [mem8 0xC11B]; set p2 [mem8 0xC11C]; set p3 [mem8 0xC11D]; set p4 [mem8 0xC11E]
    set id [mem8 0xC125]; set bank [mem8 0xC128]; set addr [mem16 0xC129]; set size [mem16 0xC12B]; set raw [mem16 0xC12D]; set flags [mem8 0xC12F]
    logline [format "%s pc=%04X sp=%04X a=%02X hl=%04X de=%04X bc=%04X bank=%02X/%02X/%02X/%02X id=%02X desc_bank=%02X addr=%04X size=%04X raw=%04X flags=%02X mem=%s" $tag $pc $sp $a $hl $de $bc $p1 $p2 $p3 $p4 $id $bank $addr $size $raw $flags [bytes_at $addr 8]]
}

debug set_bp 0x4010 {} { state "BP_4010"; debug cont }
debug set_bp 0x4512 {} {
    global zx0_count
    incr zx0_count
    state "ZX0_ENTER_$zx0_count"
    debug cont
}
debug set_bp 0x451E {} {
    global zx0_count
    state "ZX0_RETURN_$zx0_count"
    debug cont
}

after time 7.0 { state "space_before"; keymatrixdown 8 1 }
after time 7.20 { keymatrixup 8 1 }
after time 12.0 { state "t12"; close $f; exit }
