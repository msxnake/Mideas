set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_megarom_boss_vars.log"
set f [open $log_path "w"]
set ::wrt_count 0
set ::max_wrt_logs 80

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

proc bytes_memory {base count} {
    set out {}
    for {set i 0} {$i < $count} {incr i} {
        lappend out [format "%02X" [mem8 [expr {$base + $i}]]]
    }
    return [join $out " "]
}

proc map_state {} {
    set p1 [mem8 0xC11B]
    set p2 [mem8 0xC11C]
    set p3 [mem8 0xC11D]
    set saved [mem8 0xC120]
    return [format "p=%02X/%02X/%02X saved=%02X" $p1 $p2 $p3 $saved]
}

proc boss_state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set active [mem8 0xC015]
    set phase_table [mem16 0xC019]
    set attack_table [mem16 0xC01B]
    set phase_ptr [mem16 0xC01D]
    set tile_ptr [mem16 0xC01F]
    set x [mem8 0xC021]
    set y [mem8 0xC022]
    set px [mem8 0xC023]
    set py [mem8 0xC024]
    set init_phase [mem8 0xC025]
    set w [mem8 0xC026]
    set h [mem8 0xC027]
    set behavior [mem16 0xC028]
    set forms [mem16 0xC02A]
    set weak [mem16 0xC02C]
    set update_timer [mem8 0xC037]
    set action [mem8 0xC038]
    set target [mem8 0xC039]
    set tx [mem8 0xC03A]
    set ty [mem8 0xC03B]
    set aux0 [mem8 0xC03C]
    set visual [mem8 0xC03F]
    set row [mem8 0xC040]
    set col [mem8 0xC041]
    set rrow [mem8 0xC042]
    set rcol [mem8 0xC043]
    set draw [mem8 0xC044]
    set sx [mem8 0xC045]
    set sy [mem8 0xC046]
    set boss_count [mem8 0xC006]
    set boss_table [mem16 0xC007]
    set boss_bank [mem8 0xC009]
    set entry [bytes_memory 0xC00A 11]
    logline [format "%s pc=%04X sp=%04X %s count=%02X table=%04X bank=%02X entry=%s active=%02X phaseTbl=%04X atkTbl=%04X phase=%04X tile=%04X xy=%02X,%02X prev=%02X,%02X init=%02X wh=%02X,%02X beh=%04X forms=%04X weak=%04X timer=%02X act=%02X tgt=%02X@%02X,%02X aux0=%02X dirty=%02X rowcol=%02X,%02X rest=%02X,%02X draw=%02X@%02X,%02X" $tag $pc $sp [map_state] $boss_count $boss_table $boss_bank $entry $active $phase_table $attack_table $phase_ptr $tile_ptr $x $y $px $py $init_phase $w $h $behavior $forms $weak $update_timer $action $target $tx $ty $aux0 $visual $row $col $rrow $rcol $draw $sx $sy]
}

proc trace_wrt {} {
    set h [reg H]
    set l [reg L]
    set hl [expr {($h << 8) | $l}]
    if {$hl < 0x1800 || $hl >= 0x1B00} { return }
    set sp [reg SP]
    set ret [mem16 $sp]
    if {$ret != 0x6312} { return }
    incr ::wrt_count
    if {$::wrt_count <= $::max_wrt_logs} {
        set a [reg A]
        boss_state [format "WRT_%03d hl=%04X a=%02X" $::wrt_count $hl $a]
    }
}

proc bp_log {tag} {
    if {[mem8 0xC11B] != 0x04} {
        debug cont
        return
    }
    boss_state $tag
    debug cont
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {} {
    down 1
    after time 0.20 { up 1 }
}

debug set_bp 0x6083 {} { bp_log "BP_init_screen_boss" }
debug set_bp 0x60FE {} { bp_log "BP_resolve_phase" }
debug set_bp 0x6148 {} { bp_log "BP_init_behavior" }
debug set_bp 0x601C {} { bp_log "BP_update_boss" }
debug set_bp 0x616E {} { bp_log "BP_draw_active" }
debug set_bp 0x61E9 {} { bp_log "BP_restore_exposed" }
debug set_bp 0x63EC {} { bp_log "BP_apply_form" }
debug set_bp 0x40E6 {} {
    trace_wrt
    debug cont
}

after time 7.0  { tap_space }
after time 12.0 { tap_space }
after time 13.5 { boss_state "FINAL"; logline [format "done wrt=%d" $::wrt_count]; close $f; exit }
