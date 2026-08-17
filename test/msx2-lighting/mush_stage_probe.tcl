after time 9   { screenshot -prefix mush_0_dark_ ; keymatrixdown 8 0x80 }
after time 13  { keymatrixup 8 0x80 }
after time 13.3 { screenshot -prefix mush_1_eaten_ }
after time 15.3 { screenshot -prefix mush_2_stage_ }
after time 17.3 { screenshot -prefix mush_3_stage_ }
after time 20.3 { screenshot -prefix mush_4_out_ ; after time 1 { exit } }
