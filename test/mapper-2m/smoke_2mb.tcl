set out "test/mapper-2m/stress_2mb.txt"
file delete $out
after time 4 {
    set f [open $out w]
    set done [debug read memory 0xC0FF]
    puts $f "done_marker=[format 0x%02X $done] (expect 0x77)"
    set expected {4 251 62 193 64 191 100 155 128 127 190 65 192 63 254 1}
    set ok 1
    for {set i 0} {$i < 16} {incr i} {
        set v [debug read memory [expr {0xC000 + $i}]]
        set e [lindex $expected $i]
        if {$v != $e} { set ok 0 }
        puts $f "byte$i=$v expect=$e [expr {$v == $e ? {OK} : {FAIL}}]"
    }
    set sccA [debug read memory 0xC010]
    set sccB [debug read memory 0xC011]
    puts $f "scc_readback=[format 0x%02X $sccA],[format 0x%02X $sccB] (expect 0xAA,0x55)"
    if {$done == 0x77 && $ok && $sccA == 0xAA && $sccB == 0x55} {
        puts $f "RESULT: PASS"
    } else {
        puts $f "RESULT: FAIL"
    }
    close $f
    exit
}
