set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_dialog_top_fixed2_unified.rom"
set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_dialog_top_fixed2_probe.log"
file delete -force $__log
proc logline {msg} { global __log; set fh [open $__log a]; puts $fh $msg; close $fh }
proc dump_ram {} { logline [format "RAM dialogue_active=%02X current_box=%02X text_active=%02X width=%02X height=%02X wait_mode=%02X ptr=%02X%02X" [peek 0xC01F] [peek 0xC020] [peek 0xC021] [peek 0xC02C] [peek 0xC02D] [peek 0xC01C] [peek 0xC013] [peek 0xC012]] }
proc dump_nt_rows {} { for {set row 0} {$row < 8} {incr row} { set bytes {}; for {set col 0} {$col < 32} {incr col} { lappend bytes [format "%02X" [vpeek [expr {0x1800 + ($row * 32) + $col}]]] }; logline [format "NT%02d %s" $row [join $bytes " "]] } }
logline "loading ROM"
if {[catch {carta $__rom} err]} { logline "carta error $err"; quit }
after realtime 5 {
    logline "probe fired"
    dump_ram
    dump_nt_rows
    if {[catch {screenshot "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_dialog_top_fixed2_probe.png"} serr]} { logline "screenshot error $serr" } else { logline "screenshot ok" }
    after realtime 0.5 { quit }
}
