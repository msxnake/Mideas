set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_vram_scroll.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc vram {addr} { return [debug read "VRAM" $addr] }
proc sum_range {start len} {
    set s 0
    for {set i 0} {$i < $len} {incr i} {
        set s [expr {($s + ([vram [expr {$start + $i}]] * (($i & 15) + 1))) & 0x7FFFFFFF}]
    }
    return $s
}
proc sample {tag} {
    set pc [reg PC]
    set p0 [sum_range 0x0000 0x0800]
    set p1 [sum_range 0x0800 0x0800]
    set p2 [sum_range 0x1000 0x0800]
    set nt [sum_range 0x1800 0x0300]
    set nt_top [sum_range 0x1800 0x0100]
    set nt_mid [sum_range 0x1900 0x0100]
    set nt_bot [sum_range 0x1A00 0x0100]
    set c0 [sum_range 0x2000 0x0800]
    set c1 [sum_range 0x2800 0x0800]
    set c2 [sum_range 0x3000 0x0800]
    logline [format "%s pc=%04X pat=%d/%d/%d name=%d topmidbot=%d/%d/%d color=%d/%d/%d" $tag $pc $p0 $p1 $p2 $nt $nt_top $nt_mid $nt_bot $c0 $c1 $c2]
}
# Capture before and during smooth text scroll.
after time 78.0 { sample "t78_0" }
after time 80.0 { sample "t80_0" }
after time 80.2 { sample "t80_2" }
after time 80.4 { sample "t80_4" }
after time 80.6 { sample "t80_6" }
after time 80.8 { sample "t80_8" }
after time 81.0 { sample "t81_0" }
after time 81.2 { sample "t81_2" }
after time 81.4 { sample "t81_4" }
after time 82.0 { sample "t82_0" }
after time 83.0 { sample "t83_0" }
after time 84.0 { sample "t84_0" }
after time 85.0 { sample "t85_0" }
after time 86.0 { sample "t86_0" }
after time 87.0 { sample "t87_0" }
after time 88.0 { sample "t88_0" }
after time 89.0 { sample "t89_0" }
after time 90.0 { sample "t90_0" }
after time 91.0 { sample "t91_0" }
after time 92.0 { sample "t92_0" }
after time 93.0 { sample "t93_0" }
after time 94.0 { sample "t94_0" }
after time 95.0 { logline "DONE"; close $f; exit }
