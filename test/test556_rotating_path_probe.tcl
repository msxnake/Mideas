set log_path "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-rotating-paths/openmsx-rotating-path.log"
set f [open $log_path "w"]

proc m8 {addr} { return [expr {[debug read memory $addr] & 255}] }
proc sample {tag} {
    global f
    puts $f [format "%s slot=%02X active=%02X/%02X pos=%02X/%02X,%02X/%02X intro=%02X path=%02X/%02X" \
        $tag [m8 0xD03E] [m8 0xD00A] [m8 0xD059] \
        [m8 0xD00B] [m8 0xD00C] [m8 0xD05A] [m8 0xD05B] \
        [m8 0xD02E] [m8 0xD02D] [m8 0xD065]]
    flush $f
}
proc capture {tag} {
    sample $tag
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/Temp/test556-rotating-paths/$tag.png"
}

after time 6.4  { capture "orbit-6.4s" }
after time 7.2  { capture "orbit-7.2s" }
after time 8.0  { capture "orbit-8.0s" }
after time 8.8  { capture "orbit-8.8s" }
after time 9.6  { capture "orbit-9.6s" }
after time 10.4 { capture "orbit-10.4s" }
after time 11.2 { capture "orbit-11.2s" }
after time 12.0 { capture "orbit-12.0s" }
after time 13.6 { capture "orbit-13.6s" }
after time 15.2 { capture "orbit-15.2s" }
after time 16.8 { capture "orbit-16.8s" }
after time 18.4 { capture "orbit-18.4s"; close $f; after time 0.8 { exit } }
