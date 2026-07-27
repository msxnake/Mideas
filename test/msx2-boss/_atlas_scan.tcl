set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_atlas_scan.txt" "w"]
proc nz {y0 y1} {
    set n 0
    for {set y $y0} {$y < $y1} {incr y 4} {
        for {set x 0} {$x < 128} {incr x 8} {
            if {[debug read "physical VRAM" [expr {$y * 128 + $x}]] != 0} { incr n }
        }
    }
    return $n
}
foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 20 {
    puts $f "rows 512-560 nonzero: [nz 512 560]"
    puts $f "rows 560-620 nonzero: [nz 560 620]"
    puts $f "rows 620-688 nonzero: [nz 620 688]"
    puts $f "boss_active=[debug read memory 0xC176] x=[debug read memory 0xC177] y=[debug read memory 0xC178]"
    flush $f
    exit
}
