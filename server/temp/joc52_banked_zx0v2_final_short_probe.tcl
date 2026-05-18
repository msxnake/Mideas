set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_banked_zx0v2_final_short_probe.log"
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set pc [reg PC]; set sp [reg SP]
    set p1 [mem8 0xC11B]; set p2 [mem8 0xC11C]; set p3 [mem8 0xC11D]; set p4 [mem8 0xC11E]
    set flow [mem8 0xC104]; set screen [mem8 0xDFAC]; set irq [mem16 0xE609]; set inirq [mem8 0xE60E]
    set px [mem16 0xD95E]; set py [mem16 0xD97E]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X inirq=%02X pos=%d,%d" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $irq $inirq $px $py]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {} { state "space_before"; down 1; after time 0.20 { up 1 }; after time 0.25 { state "space_after" } }

debug set_bp 0x4010 {} { state "BP_4010"; debug cont }

after time 7.0 { tap_space }
after time 8.0 { state "t8" }
after time 9.0 { state "t9" }
after time 10.0 { state "t10"; close $f; exit }
