# Which sprite pattern group does the white square come from? After the boss
# dies, blank one candidate pattern group per step and screenshot: the step whose
# screenshot loses the square identifies the group (and therefore the writer).
set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_which_sprite.txt" "w"]
proc logline {m} { global f; puts $f $m; flush $f }
proc mem8 {a} { return [debug read memory $a] }
proc blank {addr n} { for {set i 0} {$i < $n} {incr i} { debug write {VRAM} [expr {$addr + $i}] 0 } }
foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
proc feed_eye {} {
    if {[mem8 0xC176] == 0} return
    set bx [mem8 0xC177] ; set by [mem8 0xC178]
    debug write memory 0xC0DA 1
    debug write memory 0xC0DB [expr {($bx + 34) & 0xff}]
    debug write memory 0xC0DC [expr {($by + 16) & 0xff}]
    debug write memory 0xC0DD 0
    after frame feed_eye
}
after time 12.5 { feed_eye }
after time 26.0 { logline "R5=[format %02X [debug read {VDP regs} 5]] R6=[format %02X [debug read {VDP regs} 6]] R11=[format %02X [debug read {VDP regs} 11]] R8=[format %02X [debug read {VDP regs} 8]]" }
after time 26.5 { blank 0xFC20 32 ; logline "blanked group 33 (#FC20, platform)" }
after time 27.0 { screenshot -prefix boss_blank33_ }
after time 27.5 { blank 0xFC40 32 ; logline "blanked group 34 (#FC40, boss bullet)" }
after time 28.0 { screenshot -prefix boss_blank34_ }
after time 28.5 { blank 0xFC00 32 ; logline "blanked group 32 (#FC00, player bullet)" }
after time 29.0 { screenshot -prefix boss_blank32_ ; after time 1 { exit } }
