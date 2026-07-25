# Reliable boss death smoke: feeds a player bullet EVERY FRAME into the boss
# rect (poking every ~0.12s is too sparse -- the bullet travels and despawns
# between pokes, which looks like 'no damage'). Verifies the whole chain:
#   hp -> 0, boss_active 0, boss_defeated[room] 1,
#   onDefeated setFlag (boss_flags[0]) and the chain barrier being removed.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_kill_reliable.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
proc feed {} {
    if {[mem8 0xC176] == 0} return
    set bx [mem8 0xC177]; set by [mem8 0xC178]
    debug write memory 0xC0DA 1
    debug write memory 0xC0DB [expr {($bx + 30) & 0xff}]
    debug write memory 0xC0DC [expr {($by + 30) & 0xff}]
    debug write memory 0xC0DD 0
    after frame feed
}
after time 13.0 { logline "start feeding, hp=[mem8 0xC17D]" ; feed }
after time 18.0 {
    logline "hp=[mem8 0xC17D] active=[mem8 0xC176] defeated1=[mem8 0xC193] flags0=[mem8 0xC19F] keys=[mem8 0xC0F8]"
    logline "zoneDBG localX=[mem8 0xC1A8] localY=[mem8 0xC1A9]"
    screenshot -prefix boss_killed_
    after time 1 { exit }
}
