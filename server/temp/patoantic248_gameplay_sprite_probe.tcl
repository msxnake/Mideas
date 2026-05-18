set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_gameplay_sprite_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_gameplay_sprite_probe_shots"
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
    set p1 [mem8 0xC11D]; set p2 [mem8 0xC11E]; set p3 [mem8 0xC11F]
    set flow [mem8 0xC104]; set menu [mem8 0xC107]; set screen [mem8 0xDFFB]
    set pack [mem8 0xDF7A]; set slots [mem8 0xE003]
    set px [mem16 0xE005]; set py [mem16 0xE007]; set player [mem8 0xE00A]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X flow=%02X menu=%02X screen=%02X pack=%02X slots=%02X player=%02X pxy=%d,%d" $tag $pc $sp $p1 $p2 $p3 $flow $menu $screen $pack $slots $player $px $py]
    logline [format "%s entity_active=%s" $tag [bytes_ram 0xD77E 8]]
    logline [format "%s entity_sprite_asset_index=%s" $tag [bytes_ram 0xDDBF 16]]
    logline [format "%s base_slots=%s" $tag [bytes_ram 0xDF67 16]]
    logline [format "%s sat_ram=%s" $tag [bytes_ram 0xDF7B 48]]
    logline [format "%s sat_vram=%s" $tag [bytes_vram 0x1B00 48]]
    logline [format "%s sprite_pattern_vram_0000=%s" $tag [bytes_vram 0x3800 64]]
    logline [format "%s sprite_pattern_vram_0C00=%s" $tag [bytes_vram [expr {0x3800 + (0x60 * 8)}] 64]]
}
proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $err" } else { logline "SHOTOK $name" }
}
proc tap_space {tag} {
    state "${tag}_before"
    keymatrixdown 8 1
    after time 0.30 { keymatrixup 8 1 }
    after time 0.40 [list state "${tag}_after"]
}
proc hold_right {tag} {
    state "${tag}_before"
    keymatrixdown 8 128
    after time 1.0 { keymatrixup 8 128 }
    after time 1.1 [list state "${tag}_after"]
}

debug set_bp 0xA5AF {} { state "BP_worldlink"; debug cont }
debug set_bp 0xA702 {} { state "BP_worldloop"; debug cont }

after time 7.0  { tap_space "space_intro" }
after time 12.0 { tap_space "space_start" }
after time 13.5 { shot "t13_gameplay.png" "t13_gameplay" }
after time 15.0 { hold_right "right" }
after time 16.8 { shot "t16_after_right.png" "t16_after_right" }
after time 20.0 { shot "t20_final.png" "t20_final"; close $f; exit }
