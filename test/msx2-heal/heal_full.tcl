# Full behaviour check, staying inside room 0 (short walk).
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-heal/heal_full.txt"
set f [open $log_path "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc M {a} { return [debug read memory $a] }
proc V {a} { return [debug read "physical VRAM" $a] }
proc cell {x y} {
    set base [expr {[M 0xC0D0]*0x8000 + $y*128 + $x/2}]
    set out ""
    for {set i 0} {$i < 8} {incr i} { append out [format "%02X" [V [expr {$base+$i}]]] }
    return $out
}
proc state {tag} {
    L "$tag screen=[M 0xC00B] x=[M 0xC001] health=[M 0xC1FD] flags=[M 0xD002]/[M 0xD003]"
    L "     cellA(x=128) [cell 128 182]   cellB(x=144) [cell 144 182]"
}
set ::prev -1
proc sample {n} {
    set hp [M 0xC1FD]
    if {$hp != $::prev} { L "  health -> $hp at x=[M 0xC001]"; set ::prev $hp }
    if {$n > 0} { after frame [list sample [expr {$n-1}]] }
}
after time 8 {
    state "BOOT   "
    set ::prev [M 0xC1FD]
    keymatrixdown 8 0x80
    sample 220
    after time 2.0 {
        keymatrixup 8 0x80
        after time 0.5 { L "---"; state "AFTER  "; exit }
    }
}
