set result_path "test/msx2-destroy/destroy_diag3.txt"
proc collrow {row} {
    set base [expr {0xC010 + $row * 16}]
    set out ""
    for {set x 0} {$x < 16} {incr x} {
        set v [debug read memory [expr {$base + $x}]]
        append out [expr {$v ? "#" : "."}]
    }
    return $out
}
proc snap {label} {
    global result_path
    set f [open $result_path a]
    set cd  [debug read memory 0xC2D0]
    set hits [debug read memory 0xC2D3]
    set tgt [debug read memory 0xC2D2]
    set cnt [debug read memory 0xC2D5]
    set px  [debug read memory 0xC001]
    set py  [debug read memory 0xC000]
    puts $f "$label cooldown=$cd hits=$hits target=$tgt count=$cnt pos=($px,$py)"
    foreach r {7 8 9 10 11} { puts $f "  row$r [collrow $r]" }
    close $f
}
after time 6  { keymatrixdown 8 0x01 }
after time 7  { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 9  { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 11 { keymatrixup 8 0x01 }
after time 13 {
    snap "boot"
    debug write memory 0xC001 96
    debug write memory 0xC000 144
    debug write memory 0xC008 0
    keymatrixdown 8 0x10
    keymatrixdown 2 0x80
}
after time 15 { snap "t15" }
after time 18 { snap "t18" }
after time 21 {
    keymatrixup 8 0x10
    keymatrixup 2 0x80
    snap "end"
    after time 1 { exit }
}
