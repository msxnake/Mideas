set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc60_mirror_mega_action_probe.log"
set f [open $log_path "w"]
set sm_count 0
set action_count 0

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set idx [mem8 0xDFAC]
    set facing [mem8 [expr {0xDC95 + $idx}]]
    set asset [mem8 [expr {0xDDB5 + $idx}]]
    set frame [mem8 [expr {0xDAD5 + $idx}]]
    set smlo [mem8 [expr {0xDB55 + $idx}]]
    set smhi [mem8 [expr {0xDB75 + $idx}]]
    set profUpdate [mem16 0xC139]
    set profExecSm [mem16 0xC13B]
    set profSmUpdate [mem16 0xC13D]
    logline [format "%s pc=%04X idx=%02X input=%02X prev=%02X facing=%02X asset=%02X frame=%02X smptr=%02X%02X prof=%04X/%04X/%04X" $tag [reg PC] $idx [mem8 0xC000] [mem8 0xC001] $facing $asset $frame $smhi $smlo $profUpdate $profExecSm $profSmUpdate]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state "${tag}_before"; down 1; after time 0.20 { up 1 }; after time 0.30 [list state "${tag}_after"] }
proc hold_key {tag mask duration} { state "${tag}_before"; down $mask; after time $duration [list up $mask]; after time [expr {$duration + 0.10}] [list state "${tag}_after"] }

debug set_bp 0x8000 {} {
    global sm_count
    if {$sm_count < 40} {
        incr sm_count
        logline [format "BP_SM_Update_%02d pc=%04X A=%02X B=%02X input=%02X player=%02X" $sm_count [reg PC] [reg A] [reg B] [mem8 0xC000] [mem8 0xDFAC]]
    }
    debug cont
}

debug set_bp 0x8167 {} {
    global action_count
    if {$action_count < 40} {
        incr action_count
        set hl [reg HL]
        logline [format "BP_Action_ChangeSprite_%02d pc=%04X B=%02X HL=%04X param=%02X input=%02X facing0=%02X asset0=%02X" $action_count [reg PC] [reg B] $hl [mem8 $hl] [mem8 0xC000] [mem8 0xDC95] [mem8 0xDDB5]]
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
