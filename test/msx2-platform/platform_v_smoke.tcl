set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/platform_v_log.txt"
set log [open $logpath w]
proc dump {tag} {
    global log
    set px [debug read memory 0xC001]
    set py [debug read memory 0xC000]
    set rider [debug read memory 0xC0E8]
    set platy [debug read memory 0xC0EA]
    set platdy [debug read memory 0xC0EC]
    puts $log "$tag px=$px py=$py rider=$rider platy=$platy platdy=$platdy"
    flush $log
}
for {set i 0} {$i < 28} {incr i} {
    after time [expr {4.5 + $i * 0.25}] "dump s$i"
}
after time 12 {
    screenshot C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/platform_v.png
    close $log
    exit
}
