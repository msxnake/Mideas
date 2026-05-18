set fd [open "C:/Users/salam/Downloads/mideas_textscroll1_dump_probe.log" "w"]
proc mem8 {addr} { return [debug read memory $addr] }
proc vram8 {addr} { return [debug read VRAM $addr] }
proc hex2 {v} { return [format "%02X" [expr {$v & 255}]] }
proc dump_bytes {kind start count} {
    global fd
    set line "$kind [format %04X $start]:"
    for {set i 0} {$i < $count} {incr i} {
        set a [expr {$start + $i}]
        if {$kind eq "RAM"} { set v [mem8 $a] } else { set v [vram8 $a] }
        append line " " [hex2 $v]
    }
    puts $fd $line
    flush $fd
}
proc probe {} {
    dump_bytes RAM 0xE700 64
    dump_bytes RAM 0xE800 64
    dump_bytes RAM 0xE900 64
    dump_bytes VRAM 0x0100 64
    dump_bytes VRAM 0x2100 64
}
after time 5.5 { probe }
after time 6.0 { close $fd; exit }
