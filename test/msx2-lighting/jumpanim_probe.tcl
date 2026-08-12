set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/jumpfall_log.txt"
set log [open $logpath w]

proc dump {tag} {
    global log
    set st  [debug read memory 0xC1F0]
    set abs [debug read memory 0xC1F5]
    set vy  [debug read memory 0xC006]
    set fl  [debug read memory 0xC007]
    set py  [debug read memory 0xC000]
    if {$vy > 127} { set vy [expr {$vy - 256}] }
    puts $log "$tag anim_state=$st abs_frame=$abs vy=$vy flags=$fl py=$py"
    flush $log
}

# Settle on the ground first.
after time 4 { dump ground1 }
after time 5 {
    dump ground2
    keymatrixdown 8 0x01
}
after time 5.1 { keymatrixup 8 0x01 }

# Sample the whole arc: 60 Hz, one sample every 4 frames for ~1.3 s.
for {set i 1} {$i <= 20} {incr i} {
    after time [expr {5.05 + $i * 0.066}] "dump air$i"
}
after time 8   { dump landed1 }
after time 9   { dump landed2 }
after time 9.5 {
    close $log
    exit
}
