set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc60_ascii16_sprite_stack_trace.log"
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}
proc state {tag} {
    set sp [reg SP]
    set pc [reg PC]
    set p1 [mem8 0xC11B]
    set p2 [mem8 0xC11C]
    set px [mem16 0xE133]
    set enabled [mem8 0xE137]
    set pidx [mem8 0xE138]
    set top0 [mem16 $sp]
    set top1 [mem16 [expr {$sp + 2}]]
    set top2 [mem16 [expr {$sp + 4}]]
    logline [format "%s pc=%04X sp=%04X top=%04X/%04X/%04X bank=%02X/%02X px=%04X enabled=%02X pidx=%02X" $tag $pc $sp $top0 $top1 $top2 $p1 $p2 $px $enabled $pidx]
}
proc counted_bp {tag limitVar limit} {
    upvar #0 $limitVar count
    if {![info exists count]} { set count 0 }
    if {$count < $limit} { state $tag }
    incr count
    debug cont
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} {
    state "${tag}_before"
    down 1
    after time 0.20 [list up 1]
    after time 0.25 [list state "${tag}_after"]
}

debug set_bp 0x6195 {} { counted_bp REFRESH_ENTRY hit_refresh 40 }
debug set_bp 0x61AC {} { counted_bp BEFORE_FORCE_CALL hit_before_force 40 }
debug set_bp 0x61AF {} { counted_bp AFTER_FORCE_CALL hit_after_force 40 }
debug set_bp 0x61B0 {} { counted_bp FORCE_ENTRY hit_force 40 }
debug set_bp 0x621B {} { counted_bp FORCE_DONE hit_done 40 }
debug set_bp 0xC1B7 {} { counted_bp RESCALL_ENTRY hit_res_entry 80 }
debug set_bp 0xC1F4 {} { counted_bp RESCALL_EXIT hit_res_exit 80 }

after time 7.0 { tap_space "space1" }
after time 9.0 { tap_space "space2" }
after time 13.0 {
    state "final"
    close $f
    exit
}
