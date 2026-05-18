set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_story_code_hex.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc dump_code {} {
    logline "DUMP_START"
    for {set a 0x5B80} {$a < 0x5C20} {incr a 16} {
        set line [format "%04X:" $a]
        for {set i 0} {$i < 16} {incr i} {
            if {[catch {mem8 [expr {$a+$i}]} v]} { append line " ERR" } else { append line [format " %02X" $v] }
        }
        logline $line
    }
    for {set a 0x6AE0} {$a < 0x6B30} {incr a 16} {
        set line [format "%04X:" $a]
        for {set i 0} {$i < 16} {incr i} {
            if {[catch {mem8 [expr {$a+$i}]} v]} { append line " ERR" } else { append line [format " %02X" $v] }
        }
        logline $line
    }
    logline "DUMP_DONE"
    close $f
    exit
}
after time 80 { dump_code }
