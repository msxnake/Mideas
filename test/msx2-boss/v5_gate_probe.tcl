# v5 gate diagnosis: what does bitmap_boss_cmd_busy actually read?
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/v5_gate_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
set throttle on
set LAUNCH 0x6E1A
set BUSYBIT 0x6E35
set OFF 0x6D00
set blits 0
set busyHits 0
set freeHits 0
set offHits 0
debug set_bp $LAUNCH {} { incr ::blits; debug cont }
debug set_bp $BUSYBIT {A & 1} { incr ::busyHits; debug cont }
debug set_bp $BUSYBIT {(A & 1) == 0} { incr ::freeHits; debug cont }
debug set_bp $OFF {} { incr ::offHits; debug cont }
proc report {s} {
    global blits busyHits freeHits offHits
    logline [format "t=%ds blits=%d busy=%d free=%d off=%d active=%d pos=%d,%d path=%d firemode=%d tick=%d" \
        $s $blits $busyHits $freeHits $offHits \
        [mem8 0xD173] [mem8 0xD174] [mem8 0xD175] \
        [mem8 0xD1CA] [mem8 0xD1CB] [mem8 0xD17D]]
}
foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
for {set s 12} {$s <= 24} {incr s 2} {
    after time $s "report $s"
}
after time 26 { logline "FINAL"; close $::f; exit }
logline "v5_gate_probe"
