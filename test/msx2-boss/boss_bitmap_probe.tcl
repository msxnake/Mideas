# Is the white square a SPRITE or BITMAP pixels? Dumps the bitmap bytes under it
# (page 0 and page 1, x 184..215, lines 128..152) right when the boss dies, and
# also parks the whole SAT off-screen for one screenshot.
set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_bitmap_probe.txt" "w"]
proc logline {m} { global f; puts $f $m; flush $f }
proc mem8 {a} { return [debug read memory $a] }
proc vram8 {a} { return [debug read {VRAM} $a] }
proc rowdump {tag page y} {
    set base [expr {$page * 0x8000 + $y * 128 + 92}]
    set line ""
    for {set i 0} {$i < 16} {incr i} { append line [format %02X [vram8 [expr {$base + $i}]]] " " }
    logline "$tag page$page y=$y x=184.. : $line"
}
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
after time 26.0 {
    logline "displayed_page=[mem8 0xC0C0] platform y=[mem8 0xC16C] sat6 y=[format %02X [vram8 0xF618]] x=[format %02X [vram8 0xF619]]"
    foreach y {128 130 132 134 136 138 140 142 144 146 148} { rowdump "DEAD" 0 $y ; rowdump "DEAD" 1 $y }
}
# Blank the sprite plane via R#8 bit 1 (SPD = sprite disable) and shoot a frame.
after time 26.5 {
    set r8 [debug read {VDP regs} 8]
    debug write {VDP regs} 8 [expr {$r8 | 0x02}]
    logline "R8 was [format %02X $r8], sprites disabled"
}
after time 27.0 { screenshot -prefix boss_nosprites_ ; after time 1 { exit } }
