# Regression guard for the 8.8 pool: the plain aimed cadence must still fire and
# the bullets must still travel and despawn (slots recycle, no stuck actives).
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_fixed_point.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
set fired 0
set moved 0
set lastx -1
proc watch {} {
    global fired moved lastx
    if {[mem8 0xC1AE]} {
        incr fired
        set x [mem8 0xC1AF]
        if {$lastx >= 0 && $x != $lastx} { incr moved }
        set lastx $x
    }
    after frame watch
}
foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 13 { watch }
after time 22 {
    logline "frames with a live bullet = $fired, frames where it moved = $moved"
    logline "slot0 active=[mem8 0xC1AE] x=[mem8 0xC1AF] y=[mem8 0xC1B0] dx=[mem8 0xC1B1] dy=[mem8 0xC1B2]"
    logline "slot0 fracs xf=[mem8 0xC1B3] yf=[mem8 0xC1B4] dxf=[mem8 0xC1B5] dyf=[mem8 0xC1B6]"
    after time 1 { exit }
}
