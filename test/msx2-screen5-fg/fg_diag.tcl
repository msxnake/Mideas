set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-fg/fg_diag.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
set throttle off
proc mem8 {addr} { return [debug read memory $addr] }
set n 0
set PX 0xC001
set PY 0xC000
set IDX 0xC00B
set moved -1
proc tick {} {
    global f n PX PY IDX moved
    after frame tick
    incr n
    if {$n == 200 || $n == 400} {
        logline "frame=$n idx=[mem8 $IDX] px=[mem8 $PX] py=[mem8 $PY]"
    }
    if {$n == 400} { keymatrixdown 8 0x01 }
    if {$n == 410 || $n == 500 || $n == 690} {
        logline "frame=$n px=[mem8 $PX] (RIGHT held since 400)"
    }
    if {$n == 700} {
        keymatrixup 8 0x01
        set moved [expr {[mem8 $PX] > 0}]
        logline "moved-right=$moved"
        screenshot -raw "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-fg/fg_diag_700.png"
    }
    if {$n == 720} {
        logline "vram-sat: [debug read VRAM 0xF600] [debug read VRAM 0xF601] [debug read VRAM 0xF602] | [debug read VRAM 0xF604] [debug read VRAM 0xF605] [debug read VRAM 0xF606]"
        logline "DONE"
        close $f
        exit
    }
}
logline "diag start"
after frame tick
