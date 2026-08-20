# Diagnostic: why does the H3 fixture boot into a composed room that never
# plays? Checks main-loop entry, dialogue open, CPU park spot, and whether
# SPACE presses + RIGHT ever move the player.
set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set OUTDIR  "C:/Users/salam/AppData/Local/Temp/mideas-test551"
set LOG [open "$OUTDIR/test551-h3-diag.log" w]
proc say {msg} { global LOG; puts $LOG $msg; flush $LOG }

set SYM [dict create]
set fh [open $SYMFILE r]
foreach line [split [read $fh] "\n"] {
    if {[regexp {^([A-Za-z_][A-Za-z0-9_]*): equ ([0-9A-Fa-f]+)H} [string trim $line] -> name hex]} {
        scan $hex %x addr
        dict set SYM $name $addr
    }
}
close $fh
proc sym {name} {
    global SYM
    if {![dict exists $SYM $name]} { say "SYM missing $name" ; return -1 }
    return [dict get $SYM $name]
}

set A_loop [sym bitmap_enter_game_loop]
set A_dlg  [sym bitmap_dlg_open]
set A_load [sym bitmap_room_load]
if {$A_load < 0} { set A_load [sym load_room] }
set R_player [sym player_x]
set R_screen [sym current_screen_index]
set R_dlg_state [sym bitmap_dlg_state]
set R_active [sym boss_active]

set loop_hits 0
set dlg_hits 0

after time 1.000 {
    global A_loop A_dlg A_load
    if {$A_loop >= 0} { debug set_bp $A_loop {} { incr ::loop_hits ; if {$::loop_hits <= 3} { say [format "LOOP t=%.3f" [machine_info time]] } ; debug cont } }
    if {$A_dlg >= 0}  { debug set_bp $A_dlg  {} { incr ::dlg_hits ; if {$::dlg_hits <= 5} { say [format "DLG_OPEN t=%.3f screen=%d" [machine_info time] [debug read memory $R_screen]] } ; debug cont } }
    say "ARMED loop=$A_loop dlg=$A_dlg load=$A_load"
    debug cont
}

proc poll {} {
    global R_player R_screen R_dlg_state R_active LOG
    say [format "poll t=%.3f screen=%d player_x=%d dlg_state=%d boss_active=%d PC=%04X" \
        [machine_info time] [debug read memory $R_screen] [debug read memory $R_player] \
        [debug read memory $R_dlg_state] [debug read memory $R_active] [reg PC]]
    if {[machine_info time] < 12.0} { after time 1.000 poll }
}
after time 2.000 poll

# SPACE taps from t=4 (advance/close any Room Lock dialogue), then hold RIGHT.
foreach t {4.0 4.6 5.2 5.8 6.4 7.0 7.6 8.2} {
    after time $t "keymatrixdown 8 0x20"
    after time [expr {$t + 0.15}] "keymatrixup 8 0x20"
}
after time 9.0 { keymatrixdown 8 0x80 ; say "HOLDING RIGHT" }

after time 14.000 {
    global loop_hits dlg_hits R_player R_screen
    say [format "TOTALS loop_hits=%d dlg_hits=%d screen=%d player_x=%d" \
        $loop_hits $dlg_hits [debug read memory $R_screen] [debug read memory $R_player]]
    screenshot "$::OUTDIR/test551-h3-diag-end.png"
    close $LOG
    after time 0.100 { exit }
}
debug cont
