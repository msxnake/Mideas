proc rd {addr} { return [debug read memory $addr] }
set ::log {}
proc note {m} { lappend ::log $m }
after time 6 {
    # clear walls around the enemy row so chase isn't blocked
    set base [expr {[rd 0xC004] + 256*[rd 0xC005]}]
    for {set col 0} {$col <= 15} {incr col} { debug write memory [expr {$base + 5*16 + $col}] 0 }
    debug write memory 0xC5F0 200
    note "setup mode0=[rd 0xC620] enemyx=[rd 0xC5F0] playerx=[rd 0xC000]"
    # force player far LEFT of the enemy -> enemy should move left (decrease X)
    debug write memory 0xC000 40
    after time 1.5 {
        note "afterLeft enemyx=[rd 0xC5F0] playerx=[rd 0xC000]"
        set ::x1 [rd 0xC5F0]
        # now force player far RIGHT -> enemy should move right (increase X)
        debug write memory 0xC000 230
        after time 1.5 {
            note "afterRight enemyx=[rd 0xC5F0] playerx=[rd 0xC000]"
            set fh [open "test/smoke_chase.txt" w]
            foreach l $::log { puts $fh $l }
            close $fh
            exit
        }
    }
}
