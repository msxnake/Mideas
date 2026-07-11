proc rd {addr} { return [debug read memory $addr] }
set ::log {}
proc note {msg} { lappend ::log $msg }
proc flush_log {} {
    set fh [open "test/smoke_carry.txt" w]
    foreach l $::log { puts $fh $l }
    close $fh
}
after time 6 {
    # 1) reset: start screen has 1 carryable at (64,144), idle
    note "boot count=[rd 0xC04F] st0=[rd 0xC055] x0=[rd 0xC051] y0=[rd 0xC053] px=[rd 0xC000] py=[rd 0xC001] dx=[rd 0xC002] lives=[rd 0xC011]"
    # 2) pickup: place the player on carryable slot 0 and press attack (N)
    debug write memory 0xC000 64
    debug write memory 0xC001 144
    keymatrixdown 4 0x08
    after time 0.3 {
        keymatrixup 4 0x08
        note "pickup carried=[rd 0xC04B] st0=[rd 0xC055] x0=[rd 0xC051] y0=[rd 0xC053] py=[rd 0xC001] lives=[rd 0xC011]"
        # 3) wait out the cooldown without moving (dx=1 right from boot),
        #    then throw and sample the flight a few frames in
        after time 0.6 {
            keymatrixdown 4 0x08
            after time 0.07 {
                note "fly carried=[rd 0xC04B] st0=[rd 0xC055] x0=[rd 0xC051] y0=[rd 0xC053] dir=[rd 0xC04E] lives=[rd 0xC011]"
                keymatrixup 4 0x08
                after time 2 {
                    # 4) settle: idle again, displaced to the right, on a 16px row
                    note "settle st0=[rd 0xC055] x0=[rd 0xC051] y0=[rd 0xC053] carried=[rd 0xC04B] px=[rd 0xC000] lives=[rd 0xC011]"
                    flush_log
                    exit
                }
            }
        }
    }
}
