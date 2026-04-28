set __rom "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_dialog_more_text_unified.rom"
set __out "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_more_text_probe.png"
set __log "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fakeplayer_more_text_probe.log"
file delete -force $__log
proc logline {msg} { global __log; set fh [open $__log a]; puts $fh $msg; close $fh }
proc dump_ram {} { logline [format "RAM active=%02X box=%02X text_active=%02X char_delay=%02X reload=%02X vram=%02X%02X row=%02X%02X wait=%02X ptr=%02X%02X" [peek 0xC01F] [peek 0xC020] [peek 0xC021] [peek 0xC028] [peek 0xC029] [peek 0xC025] [peek 0xC024] [peek 0xC027] [peek 0xC026] [peek 0xC01C] [peek 0xC023] [peek 0xC022]] }
proc dump_nt_rows {} { for {set row 2} {$row < 6} {incr row} { set bytes {}; for {set col 0} {$col < 32} {incr col} { lappend bytes [format "%02X" [vpeek [expr {0x1800 + ($row * 32) + $col}]]] }; logline [format "NT%02d %s" $row [join $bytes " "]] } }
logline "loading ROM"
if {[catch {carta $__rom} err]} { logline "carta error $err"; quit }
after realtime 7 {
    logline "probe fired"
    dump_ram
    dump_nt_rows
    if {[catch {screenshot $__out} serr]} { logline "screenshot error $serr" } else { logline "screenshot ok $__out" }
    after realtime 0.5 { quit }
}
