set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_dense_probe.log"
set f [open $log_path "w"]
proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}
proc mem8 {addr} { return [debug read memory $addr] }
proc sample {tag} {
    set pc [reg PC]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set exit [mem8 0xC03D]
    set flow [mem8 0xC03B]
    set goal [mem8 0xC046]
    set lives [mem8 0xC04A]
    set timelo [mem8 0xC04B]
    set timehi [mem8 0xC04C]
    set hud [mem8 0xDCA3]
    set frame [mem8 0xDCA4]
    set lastlo [mem8 0xDCA5]
    set lasthi [mem8 0xDCA6]
    set irqlo [mem8 0xEA88]
    set irqhi [mem8 0xEA89]
    set engine [mem8 0xE42C]
    set sm0l [mem8 0xE095]
    set sm0h [mem8 0xE0B5]
    set x0 [mem8 0xDE94]
    set y0 [mem8 0xDEB4]
    set dead0 [mem8 0xE654]
    set coll0 [mem8 0xE834]
    logline [format "%s pc=%04X p1=%02X p2=%02X p3=%02X exit=%02X flow=%02X goal=%02X lives=%d time=%02X%02X hud=%02X frame=%d last=%02X%02X irq=%02X%02X engine=%02X sm0=%02X%02X x0=%d y0=%d dead0=%02X coll0=%02X" $tag $pc $p1 $p2 $p3 $exit $flow $goal $lives $timehi $timelo $hud $frame $lasthi $lastlo $irqhi $irqlo $engine $sm0h $sm0l $x0 $y0 $dead0 $coll0]
}
proc tap_space {tag} {
    logline "${tag}_SPC_DOWN"
    keymatrixdown 8 1
    after time 0.18 { keymatrixup 8 1 }
}
proc dense_loop {idx max} {
    sample [format "dense_%02d" $idx]
    if {$idx < $max} {
        set next [expr {$idx + 1}]
        after time 0.1 [list dense_loop $next $max]
    }
}
after time 7.0 { tap_space "first" }
after time 9.2 { tap_space "second" }
after time 9.7 { dense_loop 0 90 }
after time 19.0 {
    sample "final"
    screenshot "C:/Users/salam/Downloads/patoantic248_dense_final.png"
    close $f
    exit
}
