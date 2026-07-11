proc rd {addr} { return [debug read memory $addr] }
after time 6 {
    set fh [open "test/diag3.txt" w]
    puts $fh "active=[rd 0xC07D] cooldown=[rd 0xC07E] shake=[rd 0xC07F]"
    puts $fh "wall_side=[rd 0xC079] lock_timer=[rd 0xC07A] lock_vx=[rd 0xC07B] key_lock=[rd 0xC07C]"
    puts $fh "coyote=[rd 0xC077] jbuf=[rd 0xC078]"
    puts $fh "flags=[rd 0xC00A] x=[rd 0xC000] y=[rd 0xC001]"
    close $fh
    exit
}
