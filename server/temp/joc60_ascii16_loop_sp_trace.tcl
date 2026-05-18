set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc60_ascii16_loop_sp_trace.log"
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC11B]
    set p2 [mem8 0xC11C]
    set irq [mem16 0xE7CB]
    set inirq [mem8 0xE7D0]
    set top0 [mem16 $sp]
    set top1 [mem16 [expr {$sp + 2}]]
    logline [format "%s pc=%04X sp=%04X top=%04X/%04X bank=%02X/%02X irq=%04X inirq=%02X" $tag $pc $sp $top0 $top1 $p1 $p2 $irq $inirq]
}

proc counted_bp {tag limitVar limit} {
    upvar #0 $limitVar count
    if {![info exists count]} { set count 0 }
    if {$count < $limit} {
        state $tag
    }
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

# Addresses inside gameflow_world_game_loop in the bank-7 lower-page overlay.
debug set_bp 0x6165 {} { counted_bp LOOP_START hit_start 20 }
debug set_bp 0x616E {} { counted_bp AFTER_AUDIO hit_audio 20 }
debug set_bp 0x6171 {} { counted_bp AFTER_INPUT hit_input 20 }
debug set_bp 0x6174 {} { counted_bp AFTER_PLAYER hit_player 20 }
debug set_bp 0x6177 {} { counted_bp AFTER_TIMER hit_timer 20 }
debug set_bp 0x617A {} { counted_bp AFTER_TRANSITION hit_transition 20 }
debug set_bp 0x617D {} { counted_bp AFTER_ENTITIES hit_entities 20 }
debug set_bp 0x6180 {} { counted_bp AFTER_DEADLY hit_deadly 20 }
debug set_bp 0x6183 {} { counted_bp AFTER_TILE_INTERACTION hit_tile 20 }
debug set_bp 0x6186 {} { counted_bp AFTER_PLAYER_SM hit_playersm 20 }
debug set_bp 0x6189 {} { counted_bp AFTER_ALL_SM hit_allsm 20 }
debug set_bp 0x618C {} { counted_bp AFTER_WALLGRAB_REFRESH hit_wallrefresh 20 }
debug set_bp 0x618F {} { counted_bp AFTER_WALLGRAB_UPDATE hit_wallupdate 20 }
debug set_bp 0x6192 {} { counted_bp AFTER_SFX hit_sfx 20 }
debug set_bp 0x6195 {} { counted_bp AFTER_ANIM hit_anim 20 }
debug set_bp 0x6198 {} { counted_bp AFTER_SPRITE_FASTPATH hit_sprite 40 }
debug set_bp 0x619B {} { counted_bp AFTER_BOSS hit_boss 20 }
debug set_bp 0x619E {} { counted_bp AFTER_SAT_UPLOAD hit_sat 20 }

after time 7.0 { tap_space "space1" }
after time 9.0 { tap_space "space2" }
after time 13.0 {
    state "final"
    close $f
    exit
}
