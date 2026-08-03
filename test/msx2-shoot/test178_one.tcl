set base "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shoot/one"
after time 9.0  { keymatrixdown 8 0x01 }
after time 9.2  { keymatrixup   8 0x01 }
after time 13   { screenshot -raw ${::base}_a_room.png }
after time 14   { keymatrixdown 8 0x80 }
after time 16   { screenshot -raw ${::base}_b_right.png ; keymatrixup 8 0x80 }
after time 17   { keymatrixdown 2 0x80 }
after time 17.4 { screenshot -raw ${::base}_c_fireB.png }
after time 17.8 { screenshot -raw ${::base}_d_fireB.png ; keymatrixup 2 0x80 }
after time 19   { after time 1 { exit } }
