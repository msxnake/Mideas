set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-resident"
set f [open "$dir/_crash.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }
# Trap the reset vector: whatever pushed us there is on top of the stack.
debug set_bp 0x0000 {} {
    global f
    set sp [reg sp]
    set lo [debug read memory $sp]
    set hi [debug read memory [expr {$sp + 1}]]
    L "RESET alcanzado. SP=[format %04X $sp] top-of-stack=[format %04X [expr {$hi*256+$lo}]]"
    L "  bank P2(#9000 shadow) no legible; room=[debug read memory 0xC00B]"
    close $f
    exit
}
for {set t 9} {$t < 20} {incr t 3} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.3}] "keymatrixup 8 0x01"
}
after time 25 { L "sin reset en 25s (no crashea en esta pasada)"; close $f; exit }
