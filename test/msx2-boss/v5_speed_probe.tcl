# v5 speed check: main-loop iterations (SAT updates) per wall-clock second.
# Healthy loop = ~60/s; the old crawl = ~0.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/v5_speed_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
set throttle on
set SAT 0x4DE4
set sat 0
set last 0
debug set_bp $SAT {} { incr ::sat; debug cont }
foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
for {set s 2} {$s <= 22} {incr s 2} {
    after time $s "logline \"t=${s}s sat=$::sat rate=[expr {$::sat - $::last}]/2s boss_active=[mem8 0xD173] boss_x=[mem8 0xD174] boss_y=[mem8 0xD175]\"; set ::last $::sat"
}
after time 24 { logline "FINAL sat=$::sat"; close $::f; exit }
logline "v5_speed_probe"
