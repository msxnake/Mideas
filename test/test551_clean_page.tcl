# Is the non-displayed page a clean, boss-free copy of the CURRENT room?
#
# WHY IT MATTERS
#   bitmap_dlg_close_box repairs the background under the dialogue by replaying
#   the room's ENTIRE render program (~192 command blocks) on the visible page.
#   Codex measured that at ~119 ms, and that slow tile-by-tile repaint is what
#   reads as "the boss sweeps the dialogue away".
#
#   bitmap_boss_restore_strips already repairs background a different way: one
#   HMMM from `visible page XOR 1`. If that page really holds a clean copy of
#   the current room, the dialogue could be repaired the same way -- one command
#   instead of ~192. The whole proposal rests on that being true, so measure it
#   rather than assume it.
#
# METHOD
#   Sample two 16x16 windows in the boss room:
#     A: a spot currently COVERED by the boss body -> visible and clean must
#        DIFFER (boss on one, room art on the other), and clean must not
#        contain the boss.
#     B: a spot far from the boss -> visible and clean must be IDENTICAL.
#   SCREEN 5: VRAM address = row * 128 + x/2. Page N starts at row N*256.

set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set OUTDIR  "C:/Users/salam/AppData/Local/Temp/mideas-test551"
set GAME_Y  20
set LOG [open "$OUTDIR/test551-clean-page.log" w]
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

set R_page   [sym bitmap_displayed_page]
set R_boss_x [sym boss_x]
set R_boss_y [sym boss_y]

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

proc compare {label row x} {
    global R_page
    set vis [debug read memory $R_page]
    set cln [expr {$vis ^ 1}]
    set a [win $row $x $vis]
    set b [win $row $x $cln]
    set diff 0
    for {set i 0} {$i < 16} {incr i} {
        if {[lindex $a $i] ne [lindex $b $i]} { incr diff }
    }
    say ""
    say "$label  at row=$row x=$x   visible page=$vis, other page=$cln   rows differing: $diff/16"
    say "   VISIBLE            OTHER PAGE"
    for {set i 0} {$i < 16} {incr i} {
        say [format "   %-18s %s" [lindex $a $i] [lindex $b $i]]
    }
}

after time 12.000 {
    global R_boss_x R_boss_y GAME_Y
    set bx [debug read memory $R_boss_x]
    set by [debug read memory $R_boss_y]
    say [format "boss at (%d,%d), body 128x96" $bx $by]
    # A: middle of the body. B: high-left, well away from a boss that patrols
    # the lower band.
    compare "A/ UNDER THE BOSS BODY" [expr {$by + $GAME_Y + 32}] [expr {$bx + 48}]
    compare "B/ AWAY FROM THE BOSS"  [expr {$GAME_Y + 24}] 32
    close $LOG
    after time 0.300 { exit }
}
