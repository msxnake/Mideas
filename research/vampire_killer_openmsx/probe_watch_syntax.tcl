set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_watch_syntax.log" "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
foreach cmd {
    {debug set_watchpoint write_mem {0x0000 0x1fff} {[debug read "physical VRAM" 0] >= 0} {debug cont}}
    {debug set_watchpoint write {physical VRAM 0x0000 0x1fff} {} {debug cont}}
    {debug set_watchpoint write_mem {"physical VRAM" 0x0000 0x1fff} {} {debug cont}}
    {debug set_watchpoint write_mem {VRAM 0x0000 0x1fff} {} {debug cont}}
} {
    if {[catch {eval $cmd} result]} {
        logline "ERR $cmd -> $result"
    } else {
        logline "OK $cmd -> $result"
    }
}
close $f
exit
