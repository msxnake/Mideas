set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shoot/probe_ram.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc both {tag} {
    set a [debug read memory 0xC001]
    set b [debug read "Main RAM" 0xC001]
    set c [debug read memory 0xC0DA]
    set d [debug read "Main RAM" 0xC0DA]
    L "$tag  player_x: memory=$a mainram=$b | pool: memory=$c mainram=$d"
}
foreach t {9 10 11 12 13 14} {
    after time $t                 "keymatrixdown 8 0x01"
    after time [expr {$t + 0.25}] "keymatrixup 8 0x01"
}
after time 16 { both "t=16 idle " }
after time 17 { keymatrixdown 8 0x80 }
after time 19 { keymatrixup 8 0x80 ; both "t=19 RIGHT" }
after time 20 { after time 1 { exit } }
