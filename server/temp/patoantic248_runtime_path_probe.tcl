set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_runtime_path_probe.log"
set f [open $log_path "w"]
set count 0

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc probe {tag} {
    global count
    if {[mem8 0xC104] == 1 && $count < 80} {
        incr count
        logline [format "%s pc=%04X runtime=%02X player=%02X flow=%02X sat=%02X %02X %02X %02X %02X %02X %02X %02X" $tag [reg PC] [mem8 0xE009] [mem8 0xE00A] [mem8 0xC104] [mem8 0xDF7B] [mem8 0xDF7C] [mem8 0xDF7D] [mem8 0xDF7E] [mem8 0xDF7F] [mem8 0xDF80] [mem8 0xDF81] [mem8 0xDF82]]
    }
}
proc tap_space {} { keymatrixdown 8 1; after time 0.22 { keymatrixup 8 1 } }

debug set_bp 0x70D7 {} { probe "deadly"; debug cont }
debug set_bp 0x75EF {} { probe "tile"; debug cont }
debug set_bp 0x7DF1 {} { probe "sm"; debug cont }
debug set_bp 0x6BB4 {} { probe "wallgrab"; debug cont }
debug set_bp 0x6BB3 {} { probe "wallgrab_update"; debug cont }
debug set_bp 0x69B2 {} { probe "anim"; debug cont }
debug set_bp 0x618F {} { probe "sprite"; debug cont }

after time 7.0  { tap_space }
after time 12.0 { tap_space }
after time 13.2 { probe "end"; close $f; exit }
