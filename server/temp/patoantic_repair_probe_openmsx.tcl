set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic_repair_probe_openmsx.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} { logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X flow=%02X runtime=%02X player=%02X pxy=%d,%d" $tag [reg PC] [reg SP] [mem8 0xC053] [mem8 0xC054] [mem8 0xC055] [mem8 0xC03B] [mem8 0xE54D] [mem8 0xE540] [mem16 0xE53B] [mem16 0xE53D]] }
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {} { down 1; after time 0.22 { up 1 } }
proc shot {name tag} { state $tag; screenshot "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic_repair_probe_shots/$name"; logline "SHOTOK $name" }
after time 7.0 { tap_space }
after time 12.0 { tap_space }
after time 13.5 { shot "t13_start.png" "t13_start" }
after time 30.0 { shot "t30_stability.png" "t30_stability" }
after time 35.0 { close $f; exit }
