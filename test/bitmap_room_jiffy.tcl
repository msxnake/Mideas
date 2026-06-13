proc rd {a} { return [debug read memory $a] }
after time 10 {
    set j1 [expr {[rd 0xFC9E] + 256*[rd 0xFC9F]}]
    after time 1 {
        set j2 [expr {[rd 0xFC9E] + 256*[rd 0xFC9F]}]
        set fh [open $::env(OUT) w]
        puts $fh "jiffy_t0=$j1 jiffy_t1=$j2 delta=[expr {$j2-$j1}] (delta~60 => BIOS frame int alive)"
        close $fh
        exit
    }
}
