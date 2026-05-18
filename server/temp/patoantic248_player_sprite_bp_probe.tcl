set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_player_sprite_bp_probe.log"
set f [open $log_path "w"]
set refresh_count 0
set force_count 0
set show_count 0

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc bytes_ram {addr count} {
    set out ""
    for {set i 0} {$i < $count} {incr i} { append out [format "%02X " [mem8 [expr {$addr + $i}]]] }
    return [string trim $out]
}
proc state_short {tag} {
    logline [format "%s pc=%04X a=%02X b=%02X c=%02X d=%02X e=%02X h=%02X l=%02X flow=%02X runtime=%02X player=%02X sat=%s" $tag [reg PC] [reg A] [reg B] [reg C] [reg D] [reg E] [reg H] [reg L] [mem8 0xC104] [mem8 0xE009] [mem8 0xE00A] [bytes_ram 0xDF7B 16]]
}
proc tap_space {} { keymatrixdown 8 1; after time 0.22 { keymatrixup 8 1 } }

debug set_bp 0x618F {} {
    global refresh_count
    if {[mem8 0xC104] == 1 && $refresh_count < 8} {
        incr refresh_count
        state_short "BP_refresh"
    }
    debug cont
}

debug set_bp 0x61AA {} {
    global force_count
    if {[mem8 0xC104] == 1 && $force_count < 16} {
        incr force_count
        state_short "BP_force"
    }
    debug cont
}

debug set_bp 0x52D8 {} {
    global show_count
    set slot [reg A]
    if {[mem8 0xC104] == 1 && $slot < 3 && $show_count < 32} {
        incr show_count
        state_short "BP_show"
    }
    debug cont
}

after time 7.0  { tap_space }
after time 12.0 { tap_space }
after time 14.5 { state_short "t14_end"; close $f; exit }
