set f [open "C:/Users/salam/Downloads/mideas_textscroll_rowblend_state2.log" "w"]
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { return [expr {[mem8 $addr] + 256 * [mem8 [expr {$addr + 1}]]}] }
proc hexline {addr len} { set s [format "%04X:" $addr]; for {set i 0} {$i<$len} {incr i} { append s [format " %02X" [mem8 [expr {$addr+$i}]]] }; return $s }
proc dumpstate {tag} {
 global f
 set pc [reg PC]; set step [mem8 0xC130]; set fine [mem8 0xC131]; set row [mem8 0xC132]; set lcol [mem8 0xC133]; set base [mem8 0xC134]; set col [mem8 0xC135]; set scan [mem8 0xC136]; set top [mem8 0xC138]; set bot [mem8 0xC139]; set count [mem8 0xC12C]; set tbl [mem16 0xC128]; set ptr [mem16 0xC12A]
 puts $f [format "%s pc=%04X step=%02X fine=%02X row=%02X lcol=%02X base=%02X col=%02X scan=%02X top=%02X bot=%02X count=%02X tbl=%04X ptr=%04X" $tag $pc $step $fine $row $lcol $base $col $scan $top $bot $count $tbl $ptr]
 puts $f [hexline $tbl 24]
 puts $f [hexline $ptr 32]
 flush $f
}
if {[catch {carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas_textscroll_rowblend_megarom.rom"} err]} { puts $f "ERR $err"; flush $f; exit 1 }
after realtime 5.0 { dumpstate "t5" }
after realtime 5.5 { close $f; exit }
