set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-fg/fg_probe_mini.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
set throttle off
set n 0
proc tick {} {
    global f n
    incr n
    if {$n == 1 || $n == 100 || $n == 600} {
        if {[catch {
            set idx [debug read memory 0xC00B]
            set vramok [catch {debug read VRAM 0xF600} vr]
            logline "frame=$n idx=$idx vramcatch=$vramok vr=$vr"
        } e]} { logline "frame=$n ERROR: $e" }
    }
    if {$n >= 610} {
        if {[catch {logline "debuglist: [debug list]"} e2]} { logline "list ERROR: $e2" }
        close $f ; exit 0
    }
}
logline "mini start"
after frame tick
