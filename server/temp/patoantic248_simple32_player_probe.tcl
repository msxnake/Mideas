set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_simple32_player_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_simple32_player_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc vram8 {addr} { if {[catch {debug read "VRAM" $addr} value]} { return -1 }; return $value }
proc bytes_ram {addr count} {
    set out ""
    for {set i 0} {$i < $count} {incr i} { append out [format "%02X " [mem8 [expr {$addr + $i}]]] }
    return [string trim $out]
}
proc bytes_vram {addr count} {
    set out ""
    for {set i 0} {$i < $count} {incr i} { append out [format "%02X " [vram8 [expr {$addr + $i}]]] }
    return [string trim $out]
}
proc state {tag} {
    logline [format "%s pc=%04X sp=%04X flow=%02X runtime=%02X player=%02X pxy=%d,%d sat=%s satv=%s" $tag [reg PC] [reg SP] [mem8 0xC104] [mem8 0xDF00] [mem8 0xDF01] [mem16 0xDEFC] [mem16 0xDEFE] [bytes_ram 0xDE72 12] [bytes_vram 0x1B00 12]]
}
proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $err" } else { logline "SHOTOK $name" }
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {} { down 1; after time 0.22 { up 1 } }
proc hold {mask duration} { down $mask; after time $duration [list up $mask] }

debug set_bp 0x4010 {} { state "BP_4010"; debug cont }

after time 7.0  { tap_space }
after time 12.0 { tap_space }
after time 13.5 { shot "t13_start.png" "t13_start" }
after time 15.0 { hold 128 1.8 }
after time 17.0 { shot "t17_right.png" "t17_right" }
after time 23.0 { shot "t23_final.png" "t23_final"; close $f; exit }
