# Boss render probe for the test551 fixture.
#
# Addresses come from test/gen_test551_boss_rom.mjs (--- probe symbols ---).
# NEVER hardcode them from an older build: the previous version of this probe
# read boss_cmd_buf at 0xD2D2 and boss_active at 0xD2C5, both two bytes off
# after a RAM-map change, so it was reporting neighbouring variables.
#
# What it measures:
#   ENTRY   how many cells the runtime is asked to draw (C on entry)
#   LAUNCH  every command block actually handed to the V9938
#   STRIP   whether the background-repair pass runs at all
set SYM_draw_cell_list  0x9850
set SYM_launch_cmd      0x97B1
set SYM_restore_strips  0x96D3
set RAM_cmd_buf         0xD2D0
set RAM_boss_active     0xD2C3
set RAM_boss_x          0xD2C4
set RAM_boss_y          0xD2C5
set RAM_cells_shown     0xD343
set RAM_anim_frame      0xD2CC
set RAM_screen_index    0xC00B

set shot "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551-probe2.png"
set LOG [open "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551-probe2.log" w]
proc say {msg} { global LOG; puts $LOG $msg; flush $LOG }
set entry_hits 0
set launch_hits 0
set strip_hits 0
set entry_counts {}

proc entry_bp {} {
    global entry_hits entry_counts
    incr entry_hits
    set c [reg C]
    lappend entry_counts $c
    if {$entry_hits <= 6} {
        say [format "ENTRY  #%d  C=%d (cells requested)  HL=%04X" $entry_hits $c [reg HL]]
    }
    debug cont
}

proc launch_bp {} {
    global launch_hits RAM_cmd_buf
    incr launch_hits
    if {$launch_hits <= 20} {
        set b $RAM_cmd_buf
        proc w {a} { return [expr {[debug read memory $a] | ([debug read memory [expr {$a+1}]] << 8)}] }
        say [format "LAUNCH #%d  SX=%d SY=%d -> DX=%d DY=%d  NX=%d NY=%d  op=%02X" \
            $launch_hits [w $b] [w [expr {$b+2}]] [w [expr {$b+4}]] [w [expr {$b+6}]] \
            [w [expr {$b+8}]] [w [expr {$b+10}]] [debug read memory [expr {$b+14}]]]
    }
    debug cont
}

proc strip_bp {} {
    global strip_hits
    incr strip_hits
    debug cont
}

after time 5.000 {
    global SYM_draw_cell_list SYM_launch_cmd SYM_restore_strips
    debug set_bp $SYM_draw_cell_list {} { entry_bp }
    debug set_bp $SYM_launch_cmd     {} { launch_bp }
    debug set_bp $SYM_restore_strips {} { strip_bp }
    say "PROBE armed"
    debug cont
}

after time 9.000 {
    global entry_hits launch_hits strip_hits entry_counts shot
    global RAM_screen_index RAM_boss_active RAM_boss_x RAM_boss_y RAM_cells_shown RAM_anim_frame
    say [format "STATE screen=%d active=%d x=%d y=%d shown=%02X frame=%d" \
        [debug read memory $RAM_screen_index] [debug read memory $RAM_boss_active] \
        [debug read memory $RAM_boss_x] [debug read memory $RAM_boss_y] \
        [debug read memory $RAM_cells_shown] [debug read memory $RAM_anim_frame]]
    say [format "TOTALS entries=%d launches=%d restores=%d" $entry_hits $launch_hits $strip_hits]
    say "ENTRY C values: $entry_counts"
    # The verdict: entries * C should equal launches. If C=48 comes in and only
    # one launch goes out, the loop is dropping records.
    screenshot $shot
    close $LOG
    after time 0.300 { exit }
}
