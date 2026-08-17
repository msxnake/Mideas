set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-resident"
set f [open "$dir/_pc.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }
# Braces, not quotes: the samples must be taken when the callback FIRES.
proc sample {t} {
    L "t=$t PC=[format %04X [reg pc]] SP=[format %04X [reg sp]] room=[debug read memory 0xC00B]"
}
foreach t {8 10 11 12 12.5 13 13.5 14 16 20} {
    after time $t [list sample $t]
}
foreach t {9 12 15 18} {
    after time $t {keymatrixdown 8 0x01}
    after time [expr {$t + 0.3}] {keymatrixup 8 0x01}
}
after time 22 { close $f; exit }
