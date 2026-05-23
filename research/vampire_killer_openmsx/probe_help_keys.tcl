set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
set f [open "$out_dir/probe_help_keys.log" "w"]
proc logline {m} { global f; puts $f $m; flush $f; puts $m }
foreach c {{help press} {help release} {help keymatrixdown} {help plug} {help joystick} {help set} {help type} {help osd_menu}} {
    if {[catch {eval $c} r]} { logline "ERR $c -> $r" } else { logline "OK $c -> $r" }
}
close $f
exit
