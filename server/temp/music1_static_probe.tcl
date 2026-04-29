set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/music1_static_probe.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { return [expr {[mem8 $addr] | ([mem8 [expr {$addr+1}]] << 8)}] }
proc dump {tag} {
    set inst [mem16 0x5A5A]
    set volptr [mem16 [expr {$inst + 6}]]
    set msg [format "%s instptr=%04X flags=%02X defvol=%02X len=%02X loop=%02X volptr=%04X env=" $tag $inst [mem8 $inst] [mem8 [expr {$inst+1}]] [mem8 [expr {$inst+8}]] [mem8 [expr {$inst+9}]] $volptr]
    for {set i 0} {$i < 11} {incr i} {
        append msg [format "%02X," [mem8 [expr {$volptr+$i}]]]
    }
    logline $msg
}
after time 4.0 { dump "t04" }
after time 4.2 { dump "t04_2" }
after time 5.0 { dump "t05" }
after time 5.2 {
    dump "final"
    close $f
    exit
}
