after time 6 {
    set fh [open "test/pc.txt" w]
    for {set i 0} {$i < 20} {incr i} {
        puts $fh "PC=[format %04X [reg PC]]"
        after time 0.003
    }
    close $fh
    exit
}
