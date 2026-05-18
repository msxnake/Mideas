set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_e800_samples.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc hex_line {addr len} {
    set line [format "%04X:" $addr]
    for {set i 0} {$i < $len} {incr i} { append line [format " %02X" [mem8 [expr {$addr+$i}]]] }
    return $line
}
proc sample {tag} {
    logline $tag
    logline [hex_line 0xE800 64]
    logline [hex_line 0xE880 64]
    logline [hex_line 0xE900 64]
    logline [hex_line 0xEA00 64]
}
after time 80 { sample "t80" }
after time 86 { sample "t86" }
after time 87 { sample "t87" }
after time 88 { sample "t88" }
after time 89 { sample "t89" }
after time 90 { sample "t90" }
after time 94 { sample "t94" }
after time 95 { logline "DONE"; close $f; exit }
