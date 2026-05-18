set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_megarom_long_player_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_megarom_long_player_probe_shots"
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
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X flow=%02X runtime=%02X player=%02X pxy=%d,%d sat=%s satv=%s" $tag [reg PC] [reg SP] [mem8 0xC11D] [mem8 0xC11E] [mem8 0xC11F] [mem8 0xC104] [mem8 0xE009] [mem8 0xE00A] [mem16 0xE005] [mem16 0xE007] [bytes_ram 0xDF7B 12] [bytes_vram 0x1B00 12]]
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
after time 18.0 { hold 16 1.2 }
after time 19.5 { shot "t19_left.png" "t19_left" }
after time 21.0 { hold 32 0.8 }
after time 22.0 { shot "t22_up.png" "t22_up" }
after time 30.0 { shot "t30_stability.png" "t30_stability" }
after time 42.0 { shot "t42_stability.png" "t42_stability" }
after time 50.0 { shot "t50_final.png" "t50_final"; close $f; exit }
