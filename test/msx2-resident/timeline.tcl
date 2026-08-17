set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-resident"
set f [open "$dir/_tl.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }
# PC sampling tells us whether we are still inside the cartridge (#4000-#BFFF)
# or have been thrown back into BIOS/BASIC.
for {set t 8} {$t <= 30} {incr t 2} {
    after time $t "L \"t=$t PC=[format %04X [reg pc]] room=[debug read memory 0xC00B] px=[debug read memory 0xC001]\"; catch {screenshot -raw \"$dir/_tl_$t.png\"}"
}
for {set t 9} {$t < 26} {incr t 3} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.3}] "keymatrixup 8 0x01"
}
after time 31 { close $f; exit }
