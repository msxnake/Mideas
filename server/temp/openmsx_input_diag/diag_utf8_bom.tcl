set __nav_done 0
after time 6000 { keymatrixdown DOWN }
after time 6090 { keymatrixup DOWN }
after time 7170 { keymatrixdown SPACE }
after time 7260 { keymatrixup SPACE }
after time 7350 { set __nav_done 1 }
vwait __nav_done
