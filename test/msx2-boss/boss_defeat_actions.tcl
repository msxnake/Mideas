# Kills the boss and checks the full onDefeated chain, including the two new
# actions: showMessage must open the dialogue box and changeScreen must send
# the player to room 2.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_defeat_actions.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
proc state {tag} {
    logline [format "%s screen=%d pending=%d dlg=%d bossActive=%d hp=%d flag0=%d" \
        $tag [mem8 0xC00B] [mem8 0xC0D2] [mem8 0xC128] [mem8 0xC176] [mem8 0xC17D] [mem8 0xC19F]]
}
foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
proc feed {} {
    if {[mem8 0xC176] == 0} return
    set bx [mem8 0xC177]; set by [mem8 0xC178]
    debug write memory 0xC0DA 1
    debug write memory 0xC0DB [expr {($bx + 34) & 0xff}]
    debug write memory 0xC0DC [expr {($by + 16) & 0xff}]
    debug write memory 0xC0DD 0
    after frame feed
}
after time 13.0 { state "before "; feed }
after time 18.0 { state "killed " }
after time 19.0 { state "after1s" }
after time 21.0 { state "after3s"; screenshot -prefix boss_defeat_actions_; after time 1 { exit } }
