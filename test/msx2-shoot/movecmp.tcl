# Same script for both ROMs: reach the room, hold RIGHT 2s, shoot before/after.
set base $::env(SHOTBASE)
after time 9.0  { keymatrixdown 8 0x01 }
after time 9.2  { keymatrixup   8 0x01 }
after time 14   { screenshot -raw ${::base}_idle.png }
after time 15   { keymatrixdown 8 0x80 }
after time 17   { screenshot -raw ${::base}_right.png ; keymatrixup 8 0x80 }
after time 18   { after time 1 { exit } }
