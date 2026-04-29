set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic246_double_start_probe.log"
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
    set exit [mem8 0xC03D]
    set sel [mem8 0xC03E]
    set screen [mem8 0xC02D]
    logline [format "%s pc=%04X sp=%04X af=%04X bc=%04X de=%04X hl=%04X p1=%02X p2=%02X p3=%02X exit=%02X sel=%02X screen=%02X" $tag $pc $sp $af $bc $de $hl $p1 $p2 $p3 $exit $sel $screen]
}
proc tap_space {tag} {
    logline "${tag}_SPC_DOWN"
    keymatrixdown 8 1
    after time 0.18 {
        keymatrixup 8 1
    }
}
after time 6.8 {
    dump_state "before_first_spc"
    screenshot "C:/Users/salam/Downloads/patoantic246_double_00_before_first.png"
}
after time 7.0 { tap_space "first" }
after time 7.1 {
    dump_state "first_100ms"
    screenshot "C:/Users/salam/Downloads/patoantic246_double_01_first_100ms.png"
}
after time 8.1 {
    dump_state "first_1s"
    screenshot "C:/Users/salam/Downloads/patoantic246_double_02_first_1s.png"
}
after time 9.0 {
    dump_state "before_second_spc"
    screenshot "C:/Users/salam/Downloads/patoantic246_double_03_before_second.png"
}
after time 9.2 { tap_space "second" }
after time 9.3 {
    dump_state "second_100ms"
    screenshot "C:/Users/salam/Downloads/patoantic246_double_04_second_100ms.png"
}
after time 10.2 {
    dump_state "second_1s"
    screenshot "C:/Users/salam/Downloads/patoantic246_double_05_second_1s.png"
}
after time 12.0 {
    dump_state "second_3s"
    screenshot "C:/Users/salam/Downloads/patoantic246_double_06_second_3s.png"
    close $f
    exit
}
