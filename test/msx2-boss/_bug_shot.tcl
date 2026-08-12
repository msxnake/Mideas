set log "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_shot.txt"
set f [open $log "w"]
proc L {m} { global f; puts $f $m; flush $f }
set base "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_shot"
after time 2  { L "t2 pc=[format %04X [reg pc]] scr=[debug read memory 0xC00B]"; screenshot "${base}_t2.png" }
after time 5  { L "t5 pc=[format %04X [reg pc]] scr=[debug read memory 0xC00B]"; screenshot "${base}_t5.png" }
after time 9  { L "t9 pc=[format %04X [reg pc]] scr=[debug read memory 0xC00B]"; screenshot "${base}_t9.png" }
after time 14 { L "t14 pc=[format %04X [reg pc]] scr=[debug read memory 0xC00B]"; screenshot "${base}_t14.png"; close $f; exit }
