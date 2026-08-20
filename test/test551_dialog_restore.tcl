# Pixel-level regression probe for the Tuneladora Room Lock dialogue.
set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set OUTDIR  "C:/Users/salam/AppData/Local/Temp/mideas-test551"
set LOG [open "$OUTDIR/test551-dialog-restore.log" w]
proc say {msg} { global LOG; puts $LOG $msg; flush $LOG }

set SYM [dict create]
set fh [open $SYMFILE r]
set symtext [read $fh]
close $fh
foreach line [split $symtext "\n"] {
    if {[regexp {^([A-Za-z_][A-Za-z0-9_]*): equ ([0-9A-Fa-f]+)H} [string trim $line] -> name hex]} {
        scan $hex %x addr
        dict set SYM $name $addr
    }
}
proc sym {name} {
    global SYM
    if {![dict exists $SYM $name]} { error "missing symbol $name" }
    return [dict get $SYM $name]
}

set A_open  [sym bitmap_dlg_open]
set A_close [sym bitmap_dlg_close_box]
set R_dlg   [sym bitmap_dlg_state]
set R_boss  [sym boss_active]
set R_x     [sym boss_x]
set open_seen 0
set close_seen 0

proc open_bp {} {
    global open_seen R_dlg R_boss R_x OUTDIR
    if {!$open_seen} {
        set open_seen 1
        say [format "OPEN t=%.6f dlg=%d boss=%d x=%d" [machine_info time] \
            [debug read memory $R_dlg] [debug read memory $R_boss] [debug read memory $R_x]]
        screenshot "$OUTDIR/test551-dialog-before.png"
    }
    debug cont
}

proc close_bp {} {
    global close_seen R_dlg R_boss R_x OUTDIR LOG
    if {$close_seen} { debug cont; return }
    set close_seen 1
    say [format "CLOSE_ENTRY t=%.6f dlg=%d boss=%d x=%d" [machine_info time] \
        [debug read memory $R_dlg] [debug read memory $R_boss] [debug read memory $R_x]]
    screenshot "$OUTDIR/test551-dialog-close-entry.png"
    after time 0.050 {
        global R_dlg R_boss R_x OUTDIR
        say [format "AFTER_50MS t=%.6f dlg=%d boss=%d x=%d" [machine_info time] \
            [debug read memory $R_dlg] [debug read memory $R_boss] [debug read memory $R_x]]
        screenshot "$OUTDIR/test551-dialog-after-50ms.png"
    }
    after time 0.300 {
        global R_dlg R_boss R_x OUTDIR
        say [format "AFTER_300MS t=%.6f dlg=%d boss=%d x=%d" [machine_info time] \
            [debug read memory $R_dlg] [debug read memory $R_boss] [debug read memory $R_x]]
        screenshot "$OUTDIR/test551-dialog-after-300ms.png"
    }
    after time 1.000 {
        global OUTDIR LOG
        screenshot "$OUTDIR/test551-dialog-after-1s.png"
        say "PASS close callback completed"
        close $LOG
        after time 0.100 { exit }
    }
    debug cont
}

after time 2.000 {
    global A_open A_close
    debug set_bp $A_open  {} { open_bp }
    debug set_bp $A_close {} { close_bp }
    debug cont
}

# Four wait-for-input lines: one fresh press fast-forwards, the next advances.
foreach t {6.0 6.7 7.4 8.1 8.8 9.5 10.2 10.9 11.6 12.3 13.0 13.7} {
    after time $t "keymatrixdown 8 0x20"
    after time [expr {$t + 0.16}] "keymatrixup 8 0x20"
}

after time 18.000 {
    global close_seen OUTDIR LOG
    if {!$close_seen} {
        say "FAIL dialogue did not close"
        screenshot "$OUTDIR/test551-dialog-timeout.png"
    }
    close $LOG
    after time 0.100 { exit }
}
