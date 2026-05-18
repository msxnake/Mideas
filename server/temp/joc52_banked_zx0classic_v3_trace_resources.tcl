set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_banked_zx0classic_v3_trace_resources.log"
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
    set p1 [mem8 0xC11B]
    set p2 [mem8 0xC11C]
    set p3 [mem8 0xC11D]
    set p4 [mem8 0xC11E]
    set flow [mem8 0xC104]
    set screen [mem8 0xDFAC]
    set irq [mem16 0xE609]
    set inirq [mem8 0xE60E]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X inirq=%02X" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $irq $inirq]
}

proc log_resource_entry {kind} {
    set id [reg A]
    set de [reg DE]
    state [format "%s id=%02X de=%04X" $kind $id $de]
}

proc log_descriptor {kind} {
    set id [mem8 0xC125]
    set bank [mem8 0xC128]
    set addr [mem16 0xC129]
    set size [mem16 0xC12B]
    set raw [mem16 0xC12D]
    set flags [mem8 0xC12F]
    state [format "%s desc_id=%02X bank=%02X addr=%04X size=%04X raw=%04X flags=%02X" $kind $id $bank $addr $size $raw $flags]
}

debug set_bp 0x4010 {} {
    state "BP_4010"
    debug cont
}

debug set_bp 0x4555 {} {
    log_resource_entry "RAM_LOAD"
    debug cont
}

debug set_bp 0x4574 {} {
    log_resource_entry "VRAM_LOAD"
    debug cont
}

debug set_bp 0x450A {} {
    log_descriptor "ZX0_DECOMP"
    debug cont
}

after time 7.0 {
    state "space_before"
    keymatrixdown 8 1
}
after time 7.20 { keymatrixup 8 1 }
after time 10.0 { state "t10" }
after time 12.0 { close $f; exit }
