# Phase E: shots on the EYE weak point (local 22,24; multiplier x2) must hurt.
# Bullet centre = bullet_x + 8, so local L needs bullet_x = boss_x + L - 8.
set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_zones_eye.txt" "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
proc feed {} {
    if {[mem8 0xC176] == 0} return
    set bx [mem8 0xC177]
    set by [mem8 0xC178]
    debug write memory 0xC0DA 1
    debug write memory 0xC0DB [expr {($bx + 34) & 0xff}]
    debug write memory 0xC0DC [expr {($by + 16) & 0xff}]
    debug write memory 0xC0DD 0
    after frame feed
}
after time 13 { logline "hp before EYE shots = [mem8 0xC17D]" ; feed }
after time 17 { logline "hp after EYE shots = [mem8 0xC17D] (weak point x2: expect < 3)" ; exit }
