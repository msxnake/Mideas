# v5 movement check: boss blits must KEEP happening and boss_x/y must change.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/v5_move_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
set throttle on
set LAUNCH 0x6E1A
set blits 0
set last 0
debug set_bp $LAUNCH {} { incr ::blits; debug cont }
proc report {s} {
    global blits last
    set d [expr {$blits - $last}]
    set last $blits
    logline [format "t=%ds blits=%d rate=%d boss_active=%d boss=%d,%d" \
        $s $blits $d [mem8 0xD173] [mem8 0xD174] [mem8 0xD175]]
}
foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
for {set s 12} {$s <= 24} {incr s 2} {
    after time $s "report $s"
}
after time 26 { logline "FINAL blits=$::blits"; close $::f; exit }
logline "v5_move_probe"
