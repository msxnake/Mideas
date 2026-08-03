# Dump the RAM window that holds the bitmap-room player + bullet pool while the
# game is demonstrably in the playable room, so we can see what is actually live.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shoot/test178_dump.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

proc dump {tag} {
    logline "--- $tag"
    for {set base 0xC000} {$base < 0xC0F0} {incr base 16} {
        set row ""
        for {set i 0} {$i < 16} {incr i} {
            append row [format "%02X " [debug read memory [expr {$base + $i}]]]
        }
        logline [format "%04X: %s" $base $row]
    }
}

foreach t {9 10 11 12 13 14} {
    after time $t                 "keymatrixdown 8 0x01"
    after time [expr {$t + 0.25}] "keymatrixup 8 0x01"
}

after time 16 { dump "t=16 in room (idle)" }
after time 17 { keymatrixdown 8 0x80 }
after time 19 { keymatrixup 8 0x80 ; dump "t=19 after RIGHT 2s" }
after time 20 { keymatrixdown 2 0x80 }
after time 21 { keymatrixup 2 0x80 ; dump "t=21 after B 1s" }
after time 22 { after time 1 { exit } }
