set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_banked_zx0classic_v4_trace_zx0_bytes.log"
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc bytes_at {addr count} {
    set out ""
    for {set i 0} {$i < $count} {incr i} {
        append out [format "%02X " [mem8 [expr {$addr + $i}]]]
    }
    return $out
}
proc state {tag} {
    set pc [reg PC]; set sp [reg SP]; set hl [reg HL]; set de [reg DE]; set bc [reg BC]; set a [reg A]
    set p3 [mem8 0xC11D]; set addr [mem16 0xC129]
    logline [format "%s pc=%04X sp=%04X a=%02X hl=%04X de=%04X bc=%04X p3=%02X desc_addr=%04X mem=%s" $tag $pc $sp $a $hl $de $bc $p3 $addr [bytes_at $addr 32]]
}

debug set_bp 0x4512 {} { state "ZX0_ENTER"; debug cont }
debug set_bp 0x451B {} { state "BEFORE_DZX0_AFTER_MAP"; debug cont }
debug set_bp 0x451E {} { state "ZX0_RETURNED"; debug cont }
debug set_bp 0x4010 {} { state "BP_4010"; debug cont }

after time 9.0 { state "t9"; close $f; exit }
