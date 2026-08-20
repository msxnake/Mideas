# Route probe: enter a Caverna2 room WITH collectibles through a real room
# transition. If the machine survives (PC keeps moving, screen index settles
# at the gem room), the gem hang is boot-path-only; if PC parks next to
# vdp_wait_cmd_ready, the normal entry path is affected too.
set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set OUTDIR  "C:/Users/salam/AppData/Local/Temp/mideas-test551"
set LOG [open "$OUTDIR/test551-gemroute.log" w]
proc say {m} { global LOG; puts $LOG $m; flush $LOG }

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
proc sym {n} { global SYM ; return [dict get $SYM $n] }

set R_screen [sym current_screen_index]
set R_player [sym player_x]
set R_staged [sym bitmap_gem_staged_room]
set A_wait   [sym vdp_wait_cmd_ready]
set A_status2 [sym read_vdp_status_2]

after time 2.000 { keymatrixdown 8 0x80 ; say "holding RIGHT" ; debug cont }

proc poll {} {
    global R_screen R_player R_staged
    say [format "t=%.3f screen=%d player_x=%d gem_staged_room=%d PC=%04X" \
        [machine_info time] [debug read memory $R_screen] [debug read memory $R_player] \
        [debug read memory $R_staged] [reg PC]]
    if {[machine_info time] < 13.0} { after time 0.500 { poll } } else {
        # Frozen test: five PC samples 0.2 s apart. All equal and parked next
        # to the status-2 read = hung; varying = alive.
        set samples {}
        for {set i 0} {$i < 5} {incr i} {
            after time [expr {0.2 * $i}] { lappend ::samples [format %04X [reg PC]] }
        }
        after time 1.100 {
            global ::samples A_wait A_status2 R_screen LOG
            say "PC samples: $samples"
            set frozen 1
            set first [lindex $samples 0]
            foreach s $samples { if {$s ne $first} { set frozen 0 } }
            if {$frozen && ($first eq [format %04X $A_wait] || $first eq [format %04X $A_status2])} {
                say "VERDICT: ROUTE HANGS (PC parked in the VDP wait)"
            } elseif {$frozen} {
                say "VERDICT: FROZEN at $first (not the gem wait; investigate)"
            } else {
                say [format "VERDICT: ALIVE after entering the gem room (screen=%d)" [debug read memory $R_screen]]
                screenshot "$::OUTDIR/test551-gemroute-alive.png"
            }
            close $LOG
            after time 0.200 { exit }
        }
    }
}
after time 6.000 { poll }
debug cont
