set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_delayed_start_probe.log"
set f [open $log_path "w"]
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}
proc mem8 {addr} { return [debug read memory $addr] }
proc regs_line {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set flow [mem8 0xC03B]
    set exit [mem8 0xC03D]
    set screen [mem8 0xC02A]
    set lives [mem8 0xC04A]
    set timelo [mem8 0xC04B]
    set timehi [mem8 0xC04C]
    logline [format "%s pc=%04X sp=%04X p=%02X/%02X/%02X flow=%02X exit=%02X screen=%02X lives=%d time=%02X%02X" $tag $pc $sp $p1 $p2 $p3 $flow $exit $screen $lives $timehi $timelo]
}
proc tap_space {tag} {
    regs_line "${tag}_before"
    logline "${tag}_SPC_DOWN"
    keymatrixdown 8 1
    after time 0.24 { keymatrixup 8 1 }
}
proc capture {name tag} {
    global shot_dir
    regs_line $tag
    set out "$shot_dir/$name"
    if {[catch {screenshot $out} err]} {
        logline "SCREENSHOT_ERROR $out $err"
    } else {
        logline "SCREENSHOT_OK $out"
    }
}
debug set_bp 0x0000 {} {
    regs_line "BP_0000"
    debug cont
}
after time 7.0 { tap_space "first" }
after time 11.5 { capture "patoantic248_delayed_menu_11_5s.png" "shot_menu_11_5s" }
after time 12.0 { tap_space "second" }
after time 12.8 { capture "patoantic248_delayed_after_12_8s.png" "shot_after_12_8s" }
after time 14.0 { capture "patoantic248_delayed_after_14_0s.png" "shot_after_14_0s" }
after time 17.0 {
    capture "patoantic248_delayed_after_17_0s.png" "shot_after_17_0s"
    close $f
    exit
}
