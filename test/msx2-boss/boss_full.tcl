# Full boss-system smoke: armour blocks body shots, the weak point kills, and the
# defeat chain runs (persistent flag, setFlag, giveKey, chain barrier removed).
set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_full.txt" "w"]
proc logline {m} { global f; puts $f $m; flush $f }
proc mem8 {a} { return [debug read memory $a] }
foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
# Body shots (local 38,38 -> inside the invulnerable body, outside both eyes).
proc feed_body {} {
    if {[mem8 0xC176] == 0} return
    set bx [mem8 0xC177] ; set by [mem8 0xC178]
    debug write memory 0xC0DA 1
    debug write memory 0xC0DB [expr {($bx + 30) & 0xff}]
    debug write memory 0xC0DC [expr {($by + 30) & 0xff}]
    debug write memory 0xC0DD 0
    after frame feed_body
}
# Right-eye shots (local ~42,24 -> weak point, x2 damage).
proc feed_eye {} {
    if {[mem8 0xC176] == 0} return
    set bx [mem8 0xC177] ; set by [mem8 0xC178]
    debug write memory 0xC0DA 1
    debug write memory 0xC0DB [expr {($bx + 34) & 0xff}]
    debug write memory 0xC0DC [expr {($by + 16) & 0xff}]
    debug write memory 0xC0DD 0
    after frame feed_eye
}
after time 12.5 { logline "ARMED  hp=[mem8 0xC17D] barrier_top=[mem8 0xC018] barrier_west=[mem8 0xC050] (128 = sealed)" ; feed_body }
after time 15.5 { logline "BODY   hp=[mem8 0xC17D] (armour: must still be 3)" }
after time 15.6 { feed_eye }
after time 26.0 {
    logline "EYE    hp=[mem8 0xC17D] active=[mem8 0xC176] (weak point x2 -> dead)"
    logline "DEFEAT defeated\[1\]=[mem8 0xC193] setFlag=[mem8 0xC19F] keys=[mem8 0xC0F8]"
    logline "CHAIN  top=[mem8 0xC018] west=[mem8 0xC050] floor=[mem8 0xC0C8] (0 = reopened, floor 16 = untouched)"
    logline "BULLETS player_pool a=[mem8 0xC0DA] x=[mem8 0xC0DB] y=[mem8 0xC0DC] | boss_pool a0=[mem8 0xC1AE] a1=[mem8 0xC1B3]"
    screenshot -prefix boss_full_
    after time 1 { exit }
}
