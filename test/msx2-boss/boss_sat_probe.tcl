# SAT probe for the "stale white sprite" report. Samples the whole SAT plus the
# platform/boss-bullet pools at three points of the boss fight, then fires REAL
# bullets with the 'N' key (row 4, bit 3) to check the shoot writer refreshes its
# slots when the pool empties.
set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_sat_probe.txt" "w"]
proc logline {m} { global f; puts $f $m; flush $f }
proc mem8 {a} { return [debug read memory $a] }
proc vram8 {a} { return [debug read {VRAM} $a] }
proc hex2 {v} { return [format %02X $v] }
proc dump_sat {tag} {
    set line ""
    for {set slot 0} {$slot < 10} {incr slot} {
        set base [expr {0xF600 + $slot * 4}]
        append line "\[$slot y=[hex2 [vram8 $base]] x=[hex2 [vram8 [expr {$base+1}]]] p=[hex2 [vram8 [expr {$base+2}]]]\] "
    }
    logline "$tag SAT $line"
}
proc dump_state {tag} {
    logline "$tag platform count=[mem8 0xC169] x=[mem8 0xC16B] y=[mem8 0xC16C] | boss_active=[mem8 0xC176] hp=[mem8 0xC17D] | bullets s0=[mem8 0xC0DA] s1=[mem8 0xC0DE] s2=[mem8 0xC0E2]"
}
foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
proc feed_body {} {
    if {[mem8 0xC176] == 0} return
    set bx [mem8 0xC177] ; set by [mem8 0xC178]
    debug write memory 0xC0DA 1
    debug write memory 0xC0DB [expr {($bx + 30) & 0xff}]
    debug write memory 0xC0DC [expr {($by + 30) & 0xff}]
    debug write memory 0xC0DD 0
    after frame feed_body
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
after time 12.0 { dump_state "PRE " ; dump_sat "PRE " ; screenshot -prefix boss_probe_pre_ }
after time 12.5 { feed_body }
after time 15.6 { feed_eye }
after time 18.0 { dump_state "MID " ; dump_sat "MID " ; screenshot -prefix boss_probe_mid_ }
after time 26.0 { dump_state "DEAD" ; dump_sat "DEAD" ; screenshot -prefix boss_probe_dead_ }
# --- real shooting: 'N' = keyboard matrix row 4, bit 3 ---
after time 27.0 { keymatrixdown 4 0x08 }
after time 27.2 { keymatrixup 4 0x08 }
after time 27.3 { dump_state "SHOT" ; dump_sat "SHOT" ; screenshot -prefix boss_probe_shot_ }
after time 29.5 {
    dump_state "GONE"
    dump_sat "GONE"
    screenshot -prefix boss_probe_gone_
    after time 1 { exit }
}
