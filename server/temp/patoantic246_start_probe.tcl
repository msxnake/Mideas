set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic246_start_probe.log"
set f [open $log_path "w"]
proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}
proc mem8 {addr} { return [debug read memory $addr] }
proc dump_state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set af [reg AF]
    set bc [reg BC]
    set de [reg DE]
    set hl [reg HL]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set cur [mem8 0xC077]
    set node [mem8 0xC079]
    logline [format "%s pc=%04X sp=%04X af=%04X bc=%04X de=%04X hl=%04X p1=%02X p2=%02X p3=%02X menuSel=%02X node=%02X" $tag $pc $sp $af $bc $de $hl $p1 $p2 $p3 $cur $node]
}
after time 6.8 {
    dump_state "before_start_spc"
    screenshot "C:/Users/salam/Downloads/patoantic246_start_00_before_spc.png"
}
after time 7.0 {
    logline "SPC_DOWN"
    keymatrixdown 8 1
}
after time 7.08 {
    dump_state "after_spc_down_80ms"
    screenshot "C:/Users/salam/Downloads/patoantic246_start_01_spc_down_80ms.png"
}
after time 7.25 {
    logline "SPC_UP"
    keymatrixup 8 1
}
after time 7.35 {
    dump_state "after_spc_up_100ms"
    screenshot "C:/Users/salam/Downloads/patoantic246_start_02_after_spc_up_100ms.png"
}
after time 8.0 {
    dump_state "after_start_1s"
    screenshot "C:/Users/salam/Downloads/patoantic246_start_03_after_1s.png"
}
after time 9.0 {
    dump_state "after_start_2s"
    screenshot "C:/Users/salam/Downloads/patoantic246_start_04_after_2s.png"
}
after time 10.0 {
    dump_state "after_start_3s"
    screenshot "C:/Users/salam/Downloads/patoantic246_start_05_after_3s.png"
    close $f
    exit
}
