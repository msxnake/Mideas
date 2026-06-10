proc rd {addr} { return [debug read memory $addr] }
after time 5 {
    set ::x0 [rd 0xC000]
    set ::boxes0 [rd 0xC047]
    keymatrixdown 8 0x80
    after time 1 {
        keymatrixup 8 0x80
        set ::x1 [rd 0xC000]
        keymatrixdown 8 0x01
        after time 0.4 {
            set ::boxesAir [rd 0xC047]
            set ::coyote [rd 0xC077]
            set ::yAir [rd 0xC001]
            keymatrixup 8 0x01
            after time 1 {
                set fh [open "test/smoke_gameplay.txt" w]
                puts $fh "x0=$::x0 x1=$::x1 moved=[expr {$::x1 != $::x0}]"
                puts $fh "boxes0=$::boxes0 boxesAir=$::boxesAir stable=[expr {$::boxes0 == $::boxesAir}]"
                puts $fh "coyote=$::coyote yAir=$::yAir"
                puts $fh "boxesEnd=[rd 0xC047] xEnd=[rd 0xC000] yEnd=[rd 0xC001]"
                close $fh
                exit
            }
        }
    }
}
