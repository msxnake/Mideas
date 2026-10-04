set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/v5_move_probe3.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
set throttle on
proc report {s} {
    logline [format "t=%ds active=%d pos=%d,%d tick=%d dlg=%d" \
        $s [mem8 0xD173] [mem8 0xD174] [mem8 0xD175] \
        [mem8 0xD17D] [mem8 0xC1F5]]
}
foreach t {6 8 10 12 13 14 15 16 17 18 19 20} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.3}] "keymatrixup 8 0x01"
}
for {set s 12} {$s <= 24} {incr s 2} {
    after time $s "report $s"
}
after time 26 { logline "FINAL"; close $::f; exit }
logline "v5_move_probe3 (HEAD control, dialogue advance)"
