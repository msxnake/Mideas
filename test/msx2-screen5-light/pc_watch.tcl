set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-light/pc_watch.txt"
set f [open $log_path "w"]
proc logline {m} { global f; puts $f $m; flush $f }
set throttle off
set n 0
proc tick {} {
    global n f
    incr n
    logline "t=[format %.3f [machine_info time]] pc=[format %04X [reg pc]] sp=[format %04X [reg sp]] scr=[format %02X [debug read memory 0xC00B]]"
    if {$n >= 12} { logline "PC-WATCH-DONE"; close $f; exit }
    after time 2 tick
}
logline "pc_watch start"
after time 2 tick
