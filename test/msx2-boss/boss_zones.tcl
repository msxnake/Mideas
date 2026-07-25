# Phase E smoke: body shots must do NOTHING (armour), eye shots must hurt (x2).
# Bullet centre is (bullet_x + 8), so local target L needs bullet_x = boss_x + L - 8.
set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_zones.txt" "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
set mode 0
proc feed {} {
    global mode
    if {[mem8 0xC176] == 0} return
    set bx [mem8 0xC177]
    set by [mem8 0xC178]
    if {$mode == 0} { set lx 30 ; set ly 45 } else { set lx 22 ; set ly 24 }
    debug write memory 0xC0DA 1
    debug write memory 0xC0DB [expr {($bx + $lx - 8) & 0xff}]
    debug write memory 0xC0DC [expr {($by + $ly - 8) & 0xff}]
    debug write memory 0xC0DD 0
    after frame feed
}
after time 13 { logline "hp before = [mem8 0xC17D]" ; feed }
after time 16 { global mode ; set mode 1 ; logline "hp after BODY shots = [mem8 0xC17D] (expect unchanged)" }
after time 19 { logline "hp after EYE shots = [mem8 0xC17D] active=[mem8 0xC176] defeated=[mem8 0xC193]" ; exit }
