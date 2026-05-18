set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/pato_ascii16_init_trace.log"
set f [open $log_path "w"]
set hit_count 0

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc trace_state {tag} {
    global hit_count
    incr hit_count
    if {$hit_count > 220} {
        close_log_exit
        return
    }
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC11D]
    set p2 [mem8 0xC11E]
    set p3 [mem8 0xC11F]
    set depth [mem8 0xC2FB]
    set fbank [mem8 0xC2F9]
    set faddr [mem16 0xC2FC]
    set raddr [mem16 0xC2FE]
    set px [mem16 0xE191]
    set pei [mem8 0xE196]
    set s0 [mem16 $sp]
    set s1 [mem16 [expr {$sp + 2}]]
    set s2 [mem16 [expr {$sp + 4}]]
    logline [format "%03d %-28s pc=%04X sp=%04X s=%04X/%04X/%04X bank=%02X/%02X/%02X depth=%02X far=%02X:%04X res=%04X player=%02X x=%d" $hit_count $tag $pc $sp $s0 $s1 $s2 $p1 $p2 $p3 $depth $fbank $faddr $raddr $pei $px]
    debug cont
}

proc close_log_exit {} {
    global f
    catch {close $f}
    exit
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {} {
    down 1
    after time 0.20 { up 1 }
}

debug set_bp 0x55D4 {} { trace_state "init_game_systems" }
debug set_bp 0x4F3B {} { trace_state "init_entities_far" }
debug set_bp 0x6000 {} { trace_state "addr_6000" }
debug set_bp 0x6107 {} { trace_state "init_hero_1" }
debug set_bp 0x6A33 {} { trace_state "init_player_fast_runtime" }
debug set_bp 0x6A58 {} { trace_state "init_player_from_hero" }
debug set_bp 0x6AA8 {} { trace_state "a16r9_init_sprites_stub" }
debug set_bp 0x6AB8 {} { trace_state "a16r9_create_stub" }
debug set_bp 0x6AC8 {} { trace_state "a16r9_job_stub" }
debug set_bp 0x6AD8 {} { trace_state "a16r9_force_sprite_stub" }
debug set_bp 0x5582 {} { trace_state "call_create_entity_resident" }
debug set_bp 0x5595 {} { trace_state "call_entity_job_set_resident" }
debug set_bp 0x54B4 {} { trace_state "call_init_sprites_resident" }
debug set_bp 0xC139 {} { trace_state "RAM_far_enter" }
debug set_bp 0xC1F9 {} { trace_state "RAM_res_enter" }
debug set_bp 0xC259 {} { trace_state "RAM_tail_jump" }

after time 7.0 { tap_space }
after time 18.0 { close_log_exit }
