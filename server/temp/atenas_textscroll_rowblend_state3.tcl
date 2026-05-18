set f [open "C:/Users/salam/Downloads/mideas_textscroll_rowblend_state3.log" "w"]
proc mem8 {addr} { return [debug read memory $addr] }
proc dumpstate {tag} { global f; set pc [reg PC]; set step [mem8 0xC130]; set fine [mem8 0xC131]; set row [mem8 0xC132]; set base [mem8 0xC134]; set col [mem8 0xC135]; set scan [mem8 0xC136]; set bank [mem8 0xC152]; set lock [mem8 0xE68E]; puts $f [format "%s pc=%04X step=%02X fine=%02X row=%02X base=%02X col=%02X scan=%02X bank=%02X lock=%02X" $tag $pc $step $fine $row $base $col $scan $bank $lock]; flush $f }
if {[catch {carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas_textscroll_rowblend_megarom.rom"} err]} { puts $f "ERR $err"; flush $f; exit 1 }
after realtime 5.0 { dumpstate "t5" }
after realtime 15.0 { dumpstate "t15" }
after realtime 30.0 { dumpstate "t30" }
after realtime 30.5 { close $f; exit }
