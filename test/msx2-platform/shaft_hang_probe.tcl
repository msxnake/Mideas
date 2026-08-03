set base "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform"
set log [open "$base/shaft_hang_log.txt" w]
proc dump {tag} {
    global log
    set line "$tag room=[debug read memory 0xC00B] state=[debug read memory 0xC0D1]"
    append line " pending_room=[debug read memory 0xC0D2] dir=[debug read memory 0xC0D3]"
    append line " blkptr=[format %02X%02X [debug read memory 0xC0D5] [debug read memory 0xC0D4]]"
    append line " left=[format %02X%02X [debug read memory 0xC0D7] [debug read memory 0xC0D6]]"
    append line " bank=[debug read memory 0xC1F6] pc=[format %04X [reg pc]]"
    puts $log $line
    flush $log
}
for {set i 0} {$i < 12} {incr i} {
    after time [expr {7.5 + $i * 0.5}] "dump t$i"
}
after time 14.0 {
    close $log
    exit
}
