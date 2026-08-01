set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/light_state_log.txt"
set log [open $logpath w]

proc dump {tag} {
    global log
    set room   [debug read memory 0xC00B]
    set cnt    [debug read memory 0xC0E7]
    set state  [debug read memory 0xC0F4]
    set active [debug read memory 0xC0F9]
    set platx  [debug read memory 0xC0E9]
    set platy  [debug read memory 0xC0EA]
    set px     [debug read memory 0xC001]
    set py     [debug read memory 0xC000]
    puts $log "$tag room=$room cnt=$cnt light_state=$state light_active=$active platx=$platx platy=$platy px=$px py=$py"
    flush $log
}

# Sample the very first displayed frames: a dark room must never show state 0.
for {set i 1} {$i <= 12} {incr i} {
    after frame [expr {$i * 2}] "dump f[expr {$i * 2}]"
}
after time 3 { dump t3 }
after time 5 {
    dump t5
    screenshot -prefix light_dark_room_
}
after time 6 {
    close $log
    exit
}
