set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_story_code_dump.log"
set out "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_story_code_dump.bin"
set lf [open $log_path "w"]
proc logline {msg} { global lf; puts $lf $msg; flush $lf; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc dump_code {} {
    global out lf
    logline "DUMP_START"
    set f [open $out "wb"]
    for {set a 0x5800} {$a < 0x6C80} {incr a} {
        puts -nonewline $f [binary format C [mem8 $a]]
    }
    close $f
    logline "DUMP_DONE"
    close $lf
    exit
}
after time 80 { dump_code }
