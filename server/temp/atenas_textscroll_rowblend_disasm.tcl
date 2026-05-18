set f [open "C:/Users/salam/Downloads/mideas_textscroll_rowblend_disasm.log" "w"]
proc mem8 {addr} { return [debug read memory $addr] }
proc dumpstate {tag} {
    global f
    set pc [reg PC]
    puts $f [format "%s pc=%04X" $tag $pc]
    for {set i 0} {$i < 12} {incr i} {
        if {[catch {debug disasm [expr {$pc + $i*3}]} r]} { puts $f "disasm err $r" } else { puts $f $r }
    }
    flush $f
}
if {[catch {carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas_textscroll_rowblend_megarom.rom"} err]} { puts $f "ERR $err"; flush $f; exit 1 }
after realtime 5.0 { dumpstate "t5" }
after realtime 5.5 { close $f; exit }
