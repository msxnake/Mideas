set base "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shoot/mv"
foreach t {9 10 11 12 13 14} {
    after time $t                 "keymatrixdown 8 0x01"
    after time [expr {$t + 0.25}] "keymatrixup 8 0x01"
}
after time 16.0 { screenshot -raw ${::base}_0_idle.png }
after time 16.5 { keymatrixdown 8 0x80 }
after time 18.5 { screenshot -raw ${::base}_1_right_held.png }
after time 19.0 { keymatrixup 8 0x80 }
after time 19.5 { keymatrixdown 8 0x10 }
after time 21.5 { screenshot -raw ${::base}_2_left_held.png }
after time 22.0 { keymatrixup 8 0x10 }
after time 23 { after time 1 { exit } }
