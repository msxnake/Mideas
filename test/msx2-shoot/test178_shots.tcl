# Where does the ROM actually sit? Take screenshots along the boot sequence.
set base "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shoot/shot"

after time 4  { screenshot -raw ${::base}_t04.png }
after time 8  { screenshot -raw ${::base}_t08.png }

foreach t {9 10 11 12 13 14} {
    after time $t                 "keymatrixdown 8 0x01"
    after time [expr {$t + 0.25}] "keymatrixup 8 0x01"
}
after time 16 { screenshot -raw ${::base}_t16.png }

after time 17 { keymatrixdown 8 0x80 }
after time 19 { keymatrixup 8 0x80 }
after time 20 { screenshot -raw ${::base}_t20.png }
after time 21 { after time 1 { exit } }
