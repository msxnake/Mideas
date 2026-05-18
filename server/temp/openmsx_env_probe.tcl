set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_env_probe.log" "w"]
if {[info exists ::env(MIDEAS_PROBE_MODE)]} {
    puts $f "mode=$::env(MIDEAS_PROBE_MODE)"
} else {
    puts $f "mode_missing"
}
if {[info exists ::env(MIDEAS_SCREEN_ADDR)]} {
    set screen_addr [expr {$::env(MIDEAS_SCREEN_ADDR)}]
    puts $f "screen=$screen_addr"
}
flush $f
close $f
exit
