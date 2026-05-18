set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc60_mirror_mega_change_sprite_inner_probe.log"
set f [open $log_path "w"]
set dir_count 0
set store_count 0

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc state {tag} {
    set idx [mem8 0xDFAC]
    logline [format "%s pc=%04X input=%02X facing0=%02X asset0=%02X idx=%02X" $tag [reg PC] [mem8 0xC000] [mem8 0xDC95] [mem8 0xDDB5] $idx]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state "${tag}_before"; down 1; after time 0.20 { up 1 }; after time 0.30 [list state "${tag}_after"] }
proc hold_key {tag mask duration} { state "${tag}_before"; down $mask; after time $duration [list up $mask]; after time [expr {$duration + 0.10}] [list state "${tag}_after"] }

debug set_bp 0x81D9 {} {
    global dir_count
    if {$dir_count < 30} {
        incr dir_count
        logline [format "BP_DIR_DONE_%02d pc=%04X A=%02X B=%02X C=%02X D=%02X E=%02X HL=%04X SP=%04X input=%02X facing0=%02X asset0=%02X" $dir_count [reg PC] [reg A] [reg B] [reg C] [reg D] [reg E] [reg HL] [reg SP] [mem8 0xC000] [mem8 0xDC95] [mem8 0xDDB5]]
    }
    debug cont
}

debug set_bp 0x81DD {} {
    global store_count
    if {$store_count < 30} {
        incr store_count
        logline [format "BP_AFTER_STORE_%02d pc=%04X A=%02X B=%02X C=%02X D=%02X HL=%04X input=%02X facing0=%02X asset0=%02X" $store_count [reg PC] [reg A] [reg B] [reg C] [reg D] [reg HL] [mem8 0xC000] [mem8 0xDC95] [mem8 0xDDB5]]
    }
    debug cont
}

after time 7.0 { tap_space "space1" }
after time 9.0 { tap_space "space2" }
after time 12.0 { state "idle" }
after time 13.2 { hold_key "right" 128 1.0 }
after time 14.6 { state "after_right" }
after time 15.2 { hold_key "left" 16 1.2 }
after time 16.9 { state "after_left" }
after time 18.0 { state "final"; close $f; exit }
