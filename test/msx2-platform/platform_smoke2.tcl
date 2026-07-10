set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/platform_smoke2_log.txt"
set log [open $logpath w]
proc dump {tag} {
    global log
    set px [debug read memory 0xC001]
    set py [debug read memory 0xC000]
    set rider [debug read memory 0xC0E8]
    set platx [debug read memory 0xC0E9]
    set platdx [debug read memory 0xC0EB]
    puts $log "$tag px=$px py=$py rider=$rider platx=$platx platdx=$platdx"
    flush $log
}
set t 45
for {set i 0} {$i < 30} {incr i} {
    after time [expr {4.5 + $i * 0.25}] "dump t[expr {45 + $i * 2}]"
}
after time 13 {
    screenshot C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/platform_smoke.png
    close $log
    exit
}
