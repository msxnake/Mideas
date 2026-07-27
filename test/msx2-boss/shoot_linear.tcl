# 8.8 diagonal claim: a bullet on ring slot 6 (down-right) at speed 2 must carry
# a FRACTION, not the old whole-pixel 2,2.
#
#   unit = (sin 135deg, -cos 135deg) = (0.7071, 0.7071) -> #00B5 in 8.8
#   * 2  = #016A  ->  whole 1, fraction #6A (106)
#
# So slot0 must read dx=1 dxf=106 dy=1 dyf=106, and the bullet must travel at
# 1.41 px/frame on each axis rather than 2.
#
# Pool slot 0 = #C1AE: +0 active, +1 x, +2 y, +3 dx, +4 dy, +5 xf, +6 yf, +7 dxf, +8 dyf
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/shoot_linear.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }

set captured 0
set cap {}
set x0 -1
set y0 -1
set x1 -1
set y1 -1
set frames 0

proc watch {} {
    global captured cap x0 y0 x1 y1 frames
    if {[mem8 0xC1AE]} {
        if {!$captured} {
            set captured 1
            set cap "dx=[mem8 0xC1B1] dy=[mem8 0xC1B2] dxf=[mem8 0xC1B5] dyf=[mem8 0xC1B6]"
            set x0 [mem8 0xC1AF]
            set y0 [mem8 0xC1B0]
            set frames 0
        }
        incr frames
        set x1 [mem8 0xC1AF]
        set y1 [mem8 0xC1B0]
    }
    after frame watch
}

# Three jumps to get the player past the room entry, same as the other probes.
foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 13 { watch }
after time 26 {
    logline "velocity at spawn: $cap"
    logline "travelled dx=[expr {$x1 - $x0}] dy=[expr {$y1 - $y0}] over $frames frames"
    logline "burst idx=[mem8 0xC1CE] left=[mem8 0xC1CF] cd=[mem8 0xC1D0]"
    after time 1 { exit }
}
