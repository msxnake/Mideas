set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_double_start_probe.log"
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
    set lives [mem8 0xC04A]
    set time [mem8 0xC04B]
    set hud [mem8 0xDCA3]
    set frame [mem8 0xDCA4]
    set last [mem8 0xDCA5]
    set engine [mem8 0xE42C]
    set irqlo [mem8 0xEA88]
    set irqhi [mem8 0xEA89]
    set world [mem8 0xE42F]
    set screen_idx [mem8 0xE430]
    set transition_cd [mem8 0xE42E]
    set player_idx [mem8 0xE43A]
    set x0 [mem8 0xDE94]
    set y0 [mem8 0xDEB4]
    set vx0 [mem8 0xDED4]
    set vy0 [mem8 0xDEF4]
    set ground0 [mem8 0xE8F4]
    logline [format "%s pc=%04X sp=%04X af=%04X bc=%04X de=%04X hl=%04X p1=%02X p2=%02X p3=%02X exit=%02X sel=%02X screen=%02X world=%02X idx=%02X cd=%02X player=%02X lives=%d time=%d hud=%02X frame=%d last=%d engine=%02X irq=%02X%02X x0=%d y0=%d vx0=%d vy0=%d ground0=%02X" $tag $pc $sp $af $bc $de $hl $p1 $p2 $p3 $exit $sel $screen $world $screen_idx $transition_cd $player_idx $lives $time $hud $frame $last $engine $irqhi $irqlo $x0 $y0 $vx0 $vy0 $ground0]
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
    screenshot "C:/Users/salam/Downloads/patoantic248_double_00_before_first.png"
}
after time 7.0 { tap_space "first" }
after time 7.1 {
    dump_state "first_100ms"
    screenshot "C:/Users/salam/Downloads/patoantic248_double_01_first_100ms.png"
}
after time 8.1 {
    dump_state "first_1s"
    screenshot "C:/Users/salam/Downloads/patoantic248_double_02_first_1s.png"
}
after time 9.0 {
    dump_state "before_second_spc"
    screenshot "C:/Users/salam/Downloads/patoantic248_double_03_before_second.png"
}
after time 9.2 { tap_space "second" }
after time 9.3 {
    dump_state "second_100ms"
    screenshot "C:/Users/salam/Downloads/patoantic248_double_04_second_100ms.png"
}
after time 10.2 {
    dump_state "second_1s"
    screenshot "C:/Users/salam/Downloads/patoantic248_double_05_second_1s.png"
}
after time 12.0 {
    dump_state "second_3s"
    screenshot "C:/Users/salam/Downloads/patoantic248_double_06_second_3s.png"
}
after time 15.0 {
    dump_state "second_6s"
    screenshot "C:/Users/salam/Downloads/patoantic248_double_07_second_6s.png"
}
after time 18.0 {
    dump_state "second_9s"
    screenshot "C:/Users/salam/Downloads/patoantic248_double_08_second_9s.png"
}
after time 21.0 {
    dump_state "second_12s"
    screenshot "C:/Users/salam/Downloads/patoantic248_double_09_second_12s.png"
}
after time 24.0 {
    dump_state "second_15s"
    screenshot "C:/Users/salam/Downloads/patoantic248_double_10_second_15s.png"
}
after time 27.0 {
    dump_state "second_18s"
    screenshot "C:/Users/salam/Downloads/patoantic248_double_11_second_18s.png"
    close $f
    exit
}
