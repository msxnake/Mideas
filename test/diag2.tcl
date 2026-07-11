proc rd {addr} { return [debug read memory $addr] }
after time 6 {
    set fh [open $::env(OUT) w]
    puts $fh "flags=[rd 0xC00A] gameover=[rd 0xC012] levelcomplete=[rd 0xC014] y=[rd 0xC001] gvlo=[rd 0xC008] gvhi=[rd 0xC009]"
    close $fh
    exit
}
