set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/shaft_probe_log.txt"
set log [open $logpath w]
proc dump {tag} {
    global log
    set line "$tag room=[debug read memory 0xC00B] py=[debug read memory 0xC000] px=[debug read memory 0xC001] ram="
    for {set i 0} {$i < 24} {incr i} {
        append line "[debug read memory [expr {0xC0E5 + $i}]] "
    }
    puts $log $line
    flush $log
}
for {set i 0} {$i < 24} {incr i} {
    after time [expr {4.0 + $i * 0.25}] "dump s$i"
}
after time 11.0 {
    close $log
    exit
}
