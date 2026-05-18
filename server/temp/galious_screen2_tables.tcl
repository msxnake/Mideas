set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_screen2_tables.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc vram {addr} { return [debug read "VRAM" $addr] }
proc sum_range {start len} {
    set s 0
    for {set i 0} {$i < $len} {incr i} { set s [expr {($s + ([vram [expr {$start+$i}]] * (($i & 15)+1))) & 0x7FFFFFFF}] }
    return $s
}
proc hex_line {addr len} {
    set line [format "%04X:" $addr]
    for {set i 0} {$i < $len} {incr i} { append line [format " %02X" [vram [expr {$addr+$i}]]] }
    return $line
}
proc sample {tag} {
    logline $tag
    logline [format "sums patt=%d/%d/%d color=%d/%d/%d name=%d" [sum_range 0x0000 0x800] [sum_range 0x0800 0x800] [sum_range 0x1000 0x800] [sum_range 0x2000 0x800] [sum_range 0x2800 0x800] [sum_range 0x3000 0x800] [sum_range 0x3800 0x300]]
    logline [hex_line 0x3800 64]
    logline [hex_line 0x3840 64]
    logline [hex_line 0x2000 64]
    logline [hex_line 0x2010 64]
    logline [hex_line 0x0000 64]
    logline [hex_line 0x0010 64]
}
after time 80 { sample "t80" }
after time 88 { sample "t88" }
after time 94 { sample "t94" }
after time 95 { logline "DONE"; close $f; exit }
