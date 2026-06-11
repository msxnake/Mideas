proc rd {addr} { return [debug read memory $addr] }
after time 5 {
    set ptr [expr {[rd 0xC004] + ([rd 0xC005] << 8)}]
    set fh [open "test/wj_grid.txt" w]
    puts $fh "ptr=$ptr px=[rd 0xC000] py=[rd 0xC001]"
    for {set row 0} {$row < 12} {incr row} {
        set line ""
        for {set col 0} {$col < 16} {incr col} {
            set v [rd [expr {$ptr + $row*16 + $col}]]
            append line [expr {$v & 1 ? "X" : "."}]
        }
        puts $fh "row[format %02d $row] y=[expr {$row*16}] $line"
    }
    close $fh
    exit
}
