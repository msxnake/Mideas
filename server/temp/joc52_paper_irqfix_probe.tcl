set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_paper_irqfix_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_paper_irqfix_shots"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC11B]
    set p2 [mem8 0xC11C]
    set p3 [mem8 0xC11D]
    set p4 [mem8 0xC11E]
    set flow [mem8 0xC104]
    set screen [mem8 0xDFA4]
    set screenidx [mem8 0xDFA9]
    set irq [mem16 0xE606]
    set inirq [mem8 0xE60B]
    set player [mem8 0xDFB3]
    set px [mem16 0xD95B]
    set py [mem16 0xD97B]
    set vx [mem8 0xD99B]
    set vy [mem8 0xD9BB]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X idx=%02X irq=%04X inirq=%02X player=%02X pos=%d,%d vel=%02X/%02X" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $screenidx $irq $inirq $player $px $py $vx $vy]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state "${tag}_before"; down 1; after time 0.20 [list up 1]; after time 0.25 [list state "${tag}_after"] }
proc hold_right {tag duration} { state "${tag}_before"; down 128; after time $duration [list up 128]; after time [expr {$duration + 0.05}] [list state "${tag}_after"] }
proc shot {name tag} { global shot_dir; state $tag; if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $err" } else { logline "SHOTOK $name" } }
debug set_bp 0x4010 {} { state "BP_4010"; debug cont }
debug set_bp 0x0000 {} { state "BP_0000"; debug cont }
after time 2.0 { state "t2" }
after time 7.0 { tap_space "space1" }
after time 10.0 { shot "joc52_irqfix_t10.png" "t10" }
after time 12.0 { hold_right "right" 1.0 }
after time 14.0 { shot "joc52_irqfix_t14.png" "t14" }
after time 20.0 { shot "joc52_irqfix_t20.png" "t20" }
after time 25.0 { shot "joc52_irqfix_t25.png" "t25"; close $f; exit }
