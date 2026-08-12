set log "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_shot2.txt"
set f [open $log "w"]
proc L {m} { global f; puts $f $m; flush $f }
set base "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_shot2"
set n 0
proc mash {} {
    global n
    incr n
    if {$n % 2 == 0} { keymatrixdown 8 0x01; keymatrixdown 8 0x20 } else { keymatrixup 8 0x01; keymatrixup 8 0x20 }
    after time 0.2 mash
}
after time 3 mash
after time 6  { L "t6  pc=[format %04X [reg pc]] scr=[debug read memory 0xC00B] px=[debug read memory 0xC001]"; screenshot "${base}_t6.png" }
after time 12 { L "t12 pc=[format %04X [reg pc]] scr=[debug read memory 0xC00B] px=[debug read memory 0xC001]"; screenshot "${base}_t12.png" }
after time 20 { L "t20 pc=[format %04X [reg pc]] scr=[debug read memory 0xC00B] px=[debug read memory 0xC001]"; screenshot "${base}_t20.png" }
after time 30 { L "t30 pc=[format %04X [reg pc]] scr=[debug read memory 0xC00B] px=[debug read memory 0xC001]"; screenshot "${base}_t30.png"; close $f; exit }
