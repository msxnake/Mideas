proc rd {addr} { return [debug read memory $addr] }
after time 5 {
    set ::x0 [rd 0xC000]
    keymatrixdown 8 0x10
    after time 1 {
        keymatrixup 8 0x10
        set fh [open "test/smoke_move.txt" w]
        puts $fh "x0=$::x0 x1=[rd 0xC000]"
        close $fh
        exit
    }
}
