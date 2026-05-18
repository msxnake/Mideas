set f [open "C:/Users/salam/Downloads/mideas_textscroll_rowblend_state_fast.log" "w"]
proc mem8 {addr} { return [debug read memory $addr] }
proc dumpstate {tag} { global f; set pc [reg PC]; puts $f [format "%s pc=%04X step=%02X fine=%02X row=%02X col=%02X scan=%02X" $tag $pc [mem8 0xC130] [mem8 0xC131] [mem8 0xC132] [mem8 0xC135] [mem8 0xC136]]; flush $f }
if {[catch {carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas_textscroll_rowblend_megarom.rom"} err]} { puts $f "ERR $err"; flush $f; exit 1 }
after realtime 3.0 { dumpstate "t3" }
after realtime 5.0 { dumpstate "t5" }
after realtime 7.0 { dumpstate "t7" }
after realtime 7.5 { close $f; exit }
