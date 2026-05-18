set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_banked_zx0classic_v3_trace_zx0_return.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}
proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set hl [reg HL]
    set de [reg DE]
    set bc [reg BC]
    set a [reg A]
    set p3 [mem8 0xC11D]
    set id [mem8 0xC125]
    set bank [mem8 0xC128]
    set addr [mem16 0xC129]
    set size [mem16 0xC12B]
    set raw [mem16 0xC12D]
    set flags [mem8 0xC12F]
    logline [format "%s pc=%04X sp=%04X a=%02X hl=%04X de=%04X bc=%04X p3=%02X id=%02X bank=%02X addr=%04X size=%04X raw=%04X flags=%02X" $tag $pc $sp $a $hl $de $bc $p3 $id $bank $addr $size $raw $flags]
}

debug set_bp 0x4010 {} {
    state "BP_4010"
    debug cont
}

debug set_bp 0x450A {} {
    state "ZX0_ENTER"
    debug cont
}

debug set_bp 0x4516 {} {
    state "ZX0_RETURNED"
    debug cont
}

after time 7.0 {
    state "space_before"
    keymatrixdown 8 1
}
after time 7.20 { keymatrixup 8 1 }
after time 9.0 { state "t9"; close $f; exit }
