# One bat parked dead centre of the halo, the other far outside it, in the same
# frame: the lit one must show its grey body, the dark one only its green eyes.
set POOL 0xD056
set STRIDE 25
set shot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-bats"
set f [open "$shot/_bats_light.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc park {slots x y} {
    global POOL STRIDE
    foreach s $slots {
        set b [expr {$POOL + $s * $STRIDE}]
        debug write memory $b $x
        debug write memory [expr {$b+1}] $y
        debug write memory [expr {$b+2}] 0
        debug write memory [expr {$b+3}] 0
    }
}
proc hold {} {
    debug write memory 0xC1FD 8
    debug write memory 0xC1FF 0
    debug write memory 0xD0EB 1
    debug write memory 0xD0DB 1
    # The lighting engine recomputes the halo from the player every frame, so
    # the bat is moved to the halo instead of the halo to the bat.
    park {0 1} [expr {[debug read memory 0xD0D7] - 8}] [expr {[debug read memory 0xD0D8] - 28}]
    park {2 3} 200 64
    after time 0.2 hold
}
foreach t {3 4 5 6 7 8} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}] "keymatrixup 8 0x01"
}
after time 9 hold
after time 12 {
    L "lit bat  colour block #F440 row0=[format %02X [debug read VRAM 0xF440]] row6=[format %02X [debug read VRAM 0xF446]]"
    L "lit eyes colour block #F450 row6=[format %02X [debug read VRAM 0xF456]]"
    L "dark bat colour block #F460 row0=[format %02X [debug read VRAM 0xF460]] row6=[format %02X [debug read VRAM 0xF466]]"
    L "dark eyes colour block #F470 row6=[format %02X [debug read VRAM 0xF476]]"
    screenshot "$shot/_bat_lit_vs_dark.png"
    close $f
    exit
}
