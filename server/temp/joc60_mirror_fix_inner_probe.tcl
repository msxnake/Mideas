set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc60_mirror_fix_inner_probe.log"
set f [open $log_path "w"]
set entry_count 0
set dir_count 0
set store_count 0

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc state {tag} {
    logline [format "%s pc=%04X input=%02X facing0=%02X asset0=%02X wallactive0=%02X" $tag [reg PC] [mem8 0xC000] [mem8 0xDC95] [mem8 0xDDB5] [mem8 0xD8B4]]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state "${tag}_before"; down 1; after time 0.20 { up 1 }; after time 0.30 [list state "${tag}_after"] }
proc hold_key {tag mask duration} { state "${tag}_before"; down $mask; after time $duration [list up $mask]; after time [expr {$duration + 0.10}] [list state "${tag}_after"] }

debug set_bp 0x8167 {} {
    global entry_count
    if {$entry_count < 30} {
        incr entry_count
        set hl [reg HL]
        logline [format "BP_ENTRY_%02d pc=%04X B=%02X HL=%04X param=%02X input=%02X facing0=%02X asset0=%02X wallactive0=%02X" $entry_count [reg PC] [reg B] $hl [mem8 $hl] [mem8 0xC000] [mem8 0xDC95] [mem8 0xDDB5] [mem8 0xD8B4]]
    }
    debug cont
}

debug set_bp 0x81D1 {} {
    global dir_count
    if {$dir_count < 30} {
        incr dir_count
        logline [format "BP_DIR_DONE_%02d pc=%04X A=%02X B=%02X C=%02X D=%02X E=%02X HL=%04X input=%02X facing0=%02X asset0=%02X wallactive0=%02X" $dir_count [reg PC] [reg A] [reg B] [reg C] [reg D] [reg E] [reg HL] [mem8 0xC000] [mem8 0xDC95] [mem8 0xDDB5] [mem8 0xD8B4]]
    }
    debug cont
}

debug set_bp 0x81D5 {} {
    global store_count
    if {$store_count < 30} {
        incr store_count
        logline [format "BP_AFTER_STORE_%02d pc=%04X A=%02X B=%02X C=%02X D=%02X HL=%04X input=%02X facing0=%02X asset0=%02X wallactive0=%02X" $store_count [reg PC] [reg A] [reg B] [reg C] [reg D] [reg HL] [mem8 0xC000] [mem8 0xDC95] [mem8 0xDDB5] [mem8 0xD8B4]]
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
