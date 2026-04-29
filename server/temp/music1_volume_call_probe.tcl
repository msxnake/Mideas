set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/music1_volume_call_probe.log"
set f [open $log_path "w"]
set count 0
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }

debug set_bp 0x51F8 {} {
    global count
    set active [mem8 0xE476]
    if {$active == 1 && $count < 80} {
        incr count
        logline [format "volcall%02d row=%02X cd=%02X chA=%02X Bvol=%02X Creg=%02X notes=%02X/%02X/%02X inst=%02X/%02X/%02X vstep=%02X/%02X/%02X" $count [mem8 0xE47E] [mem8 0xE47B] [reg A] [reg B] [reg C] [mem8 0xE488] [mem8 0xE489] [mem8 0xE48A] [mem8 0xE48B] [mem8 0xE48C] [mem8 0xE48D] [mem8 0xE494] [mem8 0xE495] [mem8 0xE496]]
    }
    debug cont
}

after time 6.0 {
    close $f
    exit
}
