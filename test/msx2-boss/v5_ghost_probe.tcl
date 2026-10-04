# v5 validation: Player movement calls vs boss blits while the boss path runs.
# Gate check: bitmap_boss_cmd_busy defers body frames when the CE is busy, so
# playerCalls must track frames 1:1 even while blits pile up.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/v5_ghost_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
set throttle off
set PLAYER 0x49E4
set LAUNCH 0x6E00
set BUSY   0x6E15
set INTRO  0xD1CE
set INV    0xC1FF
set frame 0
set playerCalls 0
set blits 0
set busyHits 0
set baseFrame 0
set basePlayer 0
set baseBlits 0
set baseBusy 0
debug set_bp $PLAYER {} { incr ::playerCalls; debug cont }
debug set_bp $LAUNCH {} { incr ::blits; debug cont }
debug set_bp $BUSY {} { incr ::busyHits; debug cont }
foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 12 { debug write memory $INTRO 0 }
after time 13 {
    set ::baseFrame $::frame
    set ::basePlayer $::playerCalls
    set ::baseBlits $::blits
    set ::baseBusy $::busyHits
    logline "START frame=$::frame playerCalls=$::playerCalls blits=$::blits busyHits=$::busyHits"
}
proc watch {} {
    incr ::frame
    debug write memory $::INV 255
    if {($::frame % 60) == 0 && $::frame >= $::baseFrame} {
        logline "SAMPLE frame=[expr {$::frame - $::baseFrame}] playerCalls=[expr {$::playerCalls - $::basePlayer}] blits=[expr {$::blits - $::baseBlits}] busyHits=[expr {$::busyHits - $::baseBusy}] boss=[mem8 0xD174],[mem8 0xD175]"
    }
    if {$::frame >= $::baseFrame + 1200} { finish }
    after frame watch
}
proc finish {} {
    logline "FINAL frames=[expr {$::frame - $::baseFrame}] playerCalls=[expr {$::playerCalls - $::basePlayer}] blits=[expr {$::blits - $::baseBlits}] busyHits=[expr {$::busyHits - $::baseBusy}]"
    close $::f
    after time 1 { exit }
}
after frame watch
after time 40 { logline "TIMEOUT frame=$::frame"; close $::f; exit }
logline "v5_ghost_probe"
