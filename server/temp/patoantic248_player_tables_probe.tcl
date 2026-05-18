set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_player_tables_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_player_tables_probe_shots"
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
    set pc [reg PC]; set sp [reg SP]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X flow=%02X runtime=%02X player=%02X pxy=%d,%d" $tag $pc $sp [mem8 0xC11D] [mem8 0xC11E] [mem8 0xC11F] [mem8 0xC104] [mem8 0xE009] [mem8 0xE00A] [mem16 0xE005] [mem16 0xE007]]
    logline [format "%s comp_lo=%s" $tag [bytes_ram 0xD9DE 8]]
    logline [format "%s comp_hi=%s" $tag [bytes_ram 0xD9FE 8]]
    logline [format "%s ex=%s" $tag [bytes_ram 0xD95E 8]]
    logline [format "%s ey=%s" $tag [bytes_ram 0xD97E 8]]
    logline [format "%s sprite_cfg=%s" $tag [bytes_ram 0xDDDF 16]]
    logline [format "%s asset=%s" $tag [bytes_ram 0xDDBF 8]]
    logline [format "%s anim_frame=%s" $tag [bytes_ram 0xDADF 8]]
    logline [format "%s base_slots=%s" $tag [bytes_ram 0xDF67 18]]
    logline [format "%s sat_ram=%s" $tag [bytes_ram 0xDF7B 48]]
    logline [format "%s sat_vram=%s" $tag [bytes_vram 0x1B00 48]]
}
proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $err" } else { logline "SHOTOK $name" }
}
proc tap_space {} { keymatrixdown 8 1; after time 0.22 { keymatrixup 8 1 } }

after time 7.0  { tap_space }
after time 12.0 { tap_space }
after time 13.4 { shot "t13_tables.png" "t13_tables" }
after time 15.0 { keymatrixdown 8 128 }
after time 16.6 { keymatrixup 8 128; shot "t16_tables.png" "t16_tables" }
after time 17.5 { close $f; exit }
