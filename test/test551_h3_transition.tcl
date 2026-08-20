# H3 probe: does the hidden page hold the PREVIOUS room after a real transition,
# and does bitmap_boss_load's snapshot replace it with the CURRENT room?
#
# WHY THIS PROBE EXISTS
#   [016] found that bitmap_boss_restore_strips copies from `visible XOR 1`, and
#   that page is NOT a clean copy of the current room: pages alternate as display
#   pages, so after a flip it holds the PREVIOUS room (or nothing at boot). Every
#   prior probe booted the player straight INTO the boss room, which is the one
#   setup that cannot show the bug. [019] adds a one-shot snapshot in
#   bitmap_boss_load that mirrors the freshly composed game area to the hidden
#   page, and asks for exactly this measurement before closing the front.
#
# METHOD
#   Fixture (test/make_test551_h3_fixture.mjs) boots in the boss room's authored
#   predecessor and puts the boss room one east rail away. The probe holds RIGHT
#   until the transition fires, then:
#     PREV  - at bitmap_boss_load ENTRY (before the snapshot runs), the hidden
#             page still holds whatever the flip left there: dump three windows.
#             This is the H3 premise, measured instead of assumed.
#     POST  - after ~3 s of boss patrol, dump the same windows plus one under the
#             body, from BOTH pages. Verdicts:
#               far window   : visible == hidden  (snapshot == current room art)
#               hidden vs PREV: differ            (snapshot really replaced it)
#               vacated band : visible == hidden  (repair source is the snapshot,
#                                                not the old room, not zeros)
#
# READS ARE DONE WITH THE EMULATION PAUSED (debug break / cont) so a mid-read
# VDP command cannot tear a window.

set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set OUTDIR  "C:/Users/salam/AppData/Local/Temp/mideas-test551"
set GAME_Y  20
set LOG [open "$OUTDIR/test551-h3.log" w]
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
    if {![dict exists $SYM $name]} { say "FATAL missing symbol $name" ; error "missing $name" }
    return [dict get $SYM $name]
}

set A_load    [sym bitmap_boss_load]
set R_page    [sym bitmap_displayed_page]
set R_screen  [sym current_screen_index]
set R_boss_x  [sym boss_x]
set R_boss_y  [sym boss_y]
set R_boss_old [sym boss_old_x]
set R_active  [sym boss_active]
set R_player  [sym player_x]

say [format "SYMS load=%04X page=%04X screen=%04X player=%04X" $A_load $R_page $R_screen $R_player]

# ---- VRAM helpers (SCREEN 5: addr = row*128 + x/2; page N starts at row N*256)
proc win {row x page} {
    set out {}
    for {set r 0} {$r < 16} {incr r} {
        set line ""
        for {set c 0} {$c < 16} {incr c} {
            set addr [expr {(($page * 256) + $row + $r) * 128 + ($x + $c) / 2}]
            set byte [debug read VRAM $addr]
            if {($c % 2) == 0} { set px [expr {($byte >> 4) & 0x0F}] } else { set px [expr {$byte & 0x0F}] }
            if {$px == 0} { append line "." } else { append line [format "%X" $px] }
        }
        lappend out $line
    }
    return $out
}

proc rows_differ {a b} {
    set n 0
    for {set i 0} {$i < [llength $a]} {incr i} {
        if {[lindex $a $i] ne [lindex $b $i]} { incr n }
    }
    return $n
}

proc both_pages {row x} {
    global R_page
    set vis [debug read memory $R_page]
    return [list $vis [expr {$vis ^ 1}] [win $row $x $vis] [win $row $x [expr {$vis ^ 1}]]]
}

# Fixed windows, chosen for what each proves:
#   FAR   (32, GY+24)  - above the patrol band: pure snapshot identity check.
#   CTRL  (48, GY+44)  - never covered by the body: snapshot identity, band row.
#   TRAIL1/2 (72/88, GY+110/130) - covered while the boss held its LEFT end
#                        (x=60, body 60..188) and VACATED once it patrols to
#                        the right end (x=102, body 102..230): what
#                        restore_strips put back must be the CURRENT room, i.e.
#                        match the hidden page and NOT match the PREV dump.
#   Measured trajectory (test551_h3_traj): armed at t=8.0 holding x=60, moves
#   from t~11.8, reaches 102 at t~14.0. POST must therefore be >= load+6.5 s.
set W_FAR  [list 32 [expr {$::GAME_Y + 24}]]
set W_CTRL [list 48 [expr {$::GAME_Y + 44}]]
set W_TRAIL1 [list 72 [expr {$::GAME_Y + 110}]]
set W_TRAIL2 [list 88 [expr {$::GAME_Y + 130}]]

set load_count 0
set t_boss -1
set bx0 -1
set PREV [dict create]
set final_done 0
set teleported 0

proc load_bp {} {
    global load_count t_boss PREV R_page R_screen R_active R_boss_x GAME_Y W_FAR W_CTRL W_TRAIL1 W_TRAIL2
    incr load_count
    set scr [debug read memory $R_screen]
    set pg  [debug read memory $R_page]
    say [format "LOAD #%d t=%.3f screen=%d page=%d boss_active=%d" \
        $load_count [machine_info time] $scr $pg [debug read memory $R_active]]
    if {$scr != 0 && $t_boss < 0} {
        set t_boss [machine_info time]
        # The snapshot HMMM runs AFTER this breakpoint: dump the hidden page as
        # the flip left it. This is the only moment the H3 premise is visible.
        set hid [expr {$pg ^ 1}]
        say "PREV (hidden page BEFORE snapshot, still the previous room):"
        foreach w [list $W_FAR $W_CTRL $W_TRAIL1 $W_TRAIL2] name [list FAR CTRL TRAIL1 TRAIL2] {
            lassign $w wx wy
            dict set PREV $name [win $wy $wx $hid]
            say "  PREV/$name at x=$wx row=$wy page=$hid:"
            foreach line [dict get $PREV $name] { say "    $line" }
        }
        say "PREV-DONE t=[format %.3f [machine_info time]]"
        after time 0.200 { global bx0 R_boss_x ; set bx0 [debug read memory $R_boss_x] }
    }
    debug cont
}

# Watchdog: diagnose a blocked walk, and as a last resort place the player on
# the east edge so the edge check itself fires the transition.
proc watch {} {
    global R_player R_active load_count t_boss teleported LOG
    set px [debug read memory $R_player]
    say [format "watch t=%.3f player_x=%d boss_active=%d" [machine_info time] $px [debug read memory $R_active]]
    if {$t_boss < 0 && [machine_info time] > 7.0 && !$teleported && $px < 200} {
        set teleported 1
        say "FALLBACK: teleporting player to the east edge (x=250)"
        debug write memory $R_player 250
    }
    if {$t_boss < 0} { after time 0.500 watch }
}

# Final analysis, three seconds after the boss room load: the boss has redrawn
# and patrolled by then. Emulation is paused around every read.
proc final {} {
    global final_done t_boss R_page R_screen R_active R_boss_x R_boss_y R_boss_old
    global PREV W_FAR W_CTRL W_TRAIL1 W_TRAIL2 GAME_Y OUTDIR bx0
    if {$final_done || $t_boss < 0} return
    set final_done 1
    debug break
    set pg  [debug read memory $R_page]
    set hid [expr {$pg ^ 1}]
    set bx  [debug read memory $R_boss_x]
    set by  [debug read memory $R_boss_y]
    set box [debug read memory $R_boss_old]
    say ""
    say "================ H3 VERDICT DATA ================"
    say [format "POST t=%.3f (boss room entered at %.3f, +%.0f ms of patrol)" \
        [machine_info time] $t_boss [expr {([machine_info time] - $t_boss) * 1000.0}]]
    say [format "visible page=%d hidden page=%d screen=%d boss=(%d,%d) old_x=%d active=%d" \
        $pg $hid [debug read memory $R_screen] $bx $by $box [debug read memory $R_active]]

    # Boss spawn x, read as close to the load as the scheduler allowed.
    if {$bx0 < 0} { set bx0 [debug read memory $R_boss_old] }

    foreach name [list FAR CTRL TRAIL1 TRAIL2] w [list $W_FAR $W_CTRL $W_TRAIL1 $W_TRAIL2] {
        lassign $w wx wy
        set v [win $wy $wx $pg]
        set h [win $wy $wx $hid]
        set d_vh [rows_differ $v $h]
        set p [dict get $PREV $name]
        set d_hp [rows_differ $h $p]
        say ""
        say [format "WINDOW %-5s x=%d row=%d: visible-vs-hidden %d/16 rows differ, hidden-vs-PREV %d/16" \
            $name $wx $wy $d_vh $d_hp]
        say "   visible now:              hidden now:                PREV (old room):"
        for {set i 0} {$i < 16} {incr i} {
            say [format "   %-26s %-26s %s" [lindex $v $i] [lindex $h $i] [lindex $p $i]]
        }
    }

    # Under the body: visible should be boss art, hidden clean room.
    set ax [expr {$bx + 48}]
    set ay [expr {$by + $GAME_Y + 32}]
    if {$ax > 239} { set ax 239 }
    set v [win $ay $ax $pg]
    set h [win $ay $ax $hid]
    say ""
    say [format "WINDOW BODY  x=%d row=%d (boss %d+%d): visible-vs-hidden %d/16 rows differ (expect 16: body vs clean)" \
        $ax $ay $bx 48 [rows_differ $v $h]]
    say "   visible now:              hidden now:"
    for {set i 0} {$i < 16} {incr i} {
        say [format "   %-26s %s" [lindex $v $i] [lindex $h $i]]
    }

    set moved [expr {abs($bx - $bx0)}]
    say ""
    say [format "PATROL spawn_x=%d now_x=%d moved=%dpx" $bx0 $bx $moved]
    if {$moved < 32} {
        say "INCONCLUSIVE: boss moved less than 32px since load; the TRAIL windows were never covered+vacated."
    }

    # Whole-band tile scan: every 16x16 tile of the patrol band must satisfy
    # visible == hidden EXCEPT where an actor (boss body / player / rock)
    # legitimately sits. A restore defect shows up as differing tiles that
    # match no actor rectangle.
    say ""
    say "BAND SCAN (patrol rows 98..193): tiles where visible != hidden:"
    set band_top [expr {$by + $GAME_Y}]
    set band_bot [expr {$by + $GAME_Y + 96}]
    set unexpected 0
    for {set ty $band_top} {$ty + 16 <= $band_bot} {incr ty 16} {
        for {set tx 0} {$tx < 256} {incr tx 16} {
            set d [rows_differ [win $ty $tx $pg] [win $ty $tx $hid]]
            if {$d > 0} {
                set in_boss [expr {$tx + 16 > $bx && $tx < $bx + 128 && $ty + 16 > $by + $GAME_Y && $ty < $by + $GAME_Y + 96}]
                if {!$in_boss} {
                    incr unexpected ; set tag "OUTSIDE-BOSS"
                    say "  tile x=$tx row=$ty differs $d/16 rows (OUTSIDE-BOSS) visible content:"
                    foreach line [win $ty $tx $pg] { say "    $line" }
                } else {
                    set tag "boss"
                    say [format "  tile x=%d row=%d differs %d/16 rows (%s)" $tx $ty $d $tag]
                }
            }
        }
    }
    say [format "BAND SCAN RESULT: %d differing tiles outside the boss body (0 = restore perfect)" $unexpected]
    screenshot "$OUTDIR/test551-h3-after-patrol.png"
    say "SHOT $OUTDIR/test551-h3-after-patrol.png"
    debug cont
    after time 0.300 { close $::LOG ; after time 0.100 { exit } }
}

after time 2.000 {
    global A_load R_screen R_page R_player
    say [format "BOOT t=%.3f screen=%d page=%d player_x=%d" \
        [machine_info time] [debug read memory $R_screen] [debug read memory $R_page] [debug read memory $R_player]]
    debug set_bp $A_load {} { load_bp }
    # Cursor RIGHT: MSX key matrix row 8, bit 7. Walk east towards the boss room.
    keymatrixdown 8 0x80
    say "ARMED, holding RIGHT"
    after time 0.150 { global R_boss_old bx0 ; set bx0 [debug read memory $R_boss_old] }
    watch
    debug cont
}

# Close the boss room load -> schedule the final analysis 3 s later.
proc arm_final {} {
    global t_boss
    if {$t_boss >= 0} {
        # +6.5 s: the boss holds x=60 for ~3.8 s after arming and needs ~2.3 s
        # more to reach the right end (x=102). Only then is the 60..100 band
        # genuinely vacated and the trail test meaningful.
        after time 6.500 final
    } else {
        after time 0.100 arm_final
    }
}
after time 2.100 arm_final

after time 25.000 {
    global t_boss load_count R_screen R_player final_done LOG
    if {$t_boss < 0 && !$final_done} {
        say "FAIL: boss room never loaded (loads seen: $load_count)"
        say [format "END screen=%d player_x=%d" [debug read memory $R_screen] [debug read memory $R_player]]
        screenshot "$::OUTDIR/test551-h3-timeout.png"
        close $LOG
        after time 0.100 { exit }
    }
}
debug cont
