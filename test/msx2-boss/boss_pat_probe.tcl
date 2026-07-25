# Dumps the platform sprite pattern group (33 @ #FC20), its line-colour block
# (slot 6 @ #F460) and the boss-bullet group (34 @ #FC40) before and after the
# boss dies, to explain why the platform sprite only shows up after the kill.
set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_pat_probe.txt" "w"]
proc logline {m} { global f; puts $f $m; flush $f }
proc mem8 {a} { return [debug read memory $a] }
proc vram8 {a} { return [debug read {VRAM} $a] }
proc vdump {tag addr n} {
    set line ""
    for {set i 0} {$i < $n} {incr i} { append line [format %02X [vram8 [expr {$addr + $i}]]] " " }
    logline "$tag [format %04X $addr]: $line"
}
proc snap {tag} {
    logline "$tag platform count=[mem8 0xC169] x=[mem8 0xC16B] y=[mem8 0xC16C] boss_active=[mem8 0xC176]"
    vdump "$tag plat-pat " 0xFC20 32
    vdump "$tag plat-col " 0xF460 16
    vdump "$tag sbul-pat " 0xFC40 32
    vdump "$tag sbul-col " 0xF440 16
    vdump "$tag sat6     " 0xF618 4
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
after time 12.0 { snap "PRE " }
after time 12.5 { feed_eye }
after time 26.0 { snap "DEAD" ; after time 1 { exit } }
