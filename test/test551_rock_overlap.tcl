# Falling rock OVER painted art: the case where #98 vs #D0 is actually visible.
#
# WHY THIS SECOND CAPTURE EXISTS
#   test551_rock_capture.tcl showed no difference between TIMP and HMMM, and
#   that is not evidence that TIMP is harmless: the caverna1 backdrop is black,
#   and colour 0 renders as the backdrop, so "transparent" and "black" look the
#   same. The art dump settled the mechanism (58% of the rock cell is colour 0,
#   dithered right through the silhouette), so the difference only shows where
#   the rock passes over something painted.
#
#   With nobody at the joystick the player never moves and every rock falls in
#   the same empty column. So this probe holds RIGHT to walk the player under
#   the boss -- rocks spawn in a 32px band centred on the player -- and captures
#   the first rock whose rectangle overlaps the boss body.
#
#   ROCK_PATCH=1 -> force #D0 (pre-706ef5e6 behaviour). Unset -> ship-as-is #98.

set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set OUTDIR  "C:/Users/salam/AppData/Local/Temp/mideas-test551"
set GAME_Y  20      ;# HUD band height: room Y 0 is VRAM row 20

set PATCH 0
if {[info exists ::env(ROCK_PATCH)] && $::env(ROCK_PATCH) eq "1"} { set PATCH 1 }
set TAG [expr {$PATCH ? "over-hmmm" : "over-timp"}]

set LOG [open "$OUTDIR/test551-rock-$TAG.log" w]
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

set A_launch  [sym bitmap_boss_launch_cmd]
set R_cmd_buf [sym boss_cmd_buf]
set R_proj_x  [sym boss_proj_x]
set R_proj_y  [sym boss_proj_y]
set R_boss_x  [sym boss_x]
set R_boss_y  [sym boss_y]
set R_player_x [sym player_x]

say "MODE $TAG (PATCH=$PATCH)"

set shot_taken 0
set timp_seen 0
set near_miss 0

proc launch_bp {} {
    global R_cmd_buf PATCH shot_taken timp_seen near_miss OUTDIR TAG
    global R_proj_x R_proj_y R_boss_x R_boss_y R_player_x GAME_Y
    set opaddr [expr {$R_cmd_buf + 14}]
    if {[debug read memory $opaddr] != 0x98} { debug cont ; return }
    incr timp_seen
    set rx [debug read memory $R_proj_x]
    set ry [debug read memory $R_proj_y]
    set bx [debug read memory $R_boss_x]
    set by [debug read memory $R_boss_y]
    # Body is 128x96 for tuneladora1 (measured: 8x6 cells of 16). Demand the
    # rock be WELL inside the body, not clipping its top edge by two pixels:
    # a 2px overlap proves nothing about what shows through the art.
    set over [expr {($rx > $bx) && ($rx < $bx + 112) && ($ry > $by + 16) && ($ry < $by + 72)}]
    if {$PATCH} { debug write memory $opaddr 0xD0 }
    if {!$shot_taken && $over} {
        set shot_taken 1
        say [format "CAPTURE rock(%d,%d) over body(%d,%d,128x96) player_x=%d op=%02X" \
            $rx $ry $bx $by [debug read memory $R_player_x] [debug read memory $opaddr]]
        after time 0.040 {
            global OUTDIR TAG R_proj_x R_proj_y GAME_Y
            screenshot "$OUTDIR/rock-$TAG.png"
            say "shot -> $OUTDIR/rock-$TAG.png"
            # Eyeballing two 640x480 screenshots is not evidence. Dump the
            # 16x16 the rock just landed on, straight out of the visible page,
            # so the two modes can be diffed as text.
            set rx [debug read memory $R_proj_x]
            set ry [expr {[debug read memory $R_proj_y] + $GAME_Y}]
            say "COMPOSITED 16x16 at screen ($rx,$ry), '.' = colour 0:"
            for {set row 0} {$row < 16} {incr row} {
                set line ""
                for {set col 0} {$col < 16} {incr col} {
                    set addr [expr {($ry + $row) * 128 + ($rx + $col) / 2}]
                    set byte [debug read VRAM $addr]
                    if {($col % 2) == 0} { set px [expr {($byte >> 4) & 0x0F}] } else { set px [expr {$byte & 0x0F}] }
                    if {$px == 0} { append line "." } else { append line [format "%X" $px] }
                }
                say "  $line"
            }
        }
    } elseif {!$shot_taken} {
        incr near_miss
        if {$near_miss <= 4} {
            say [format "no overlap yet: rock(%d,%d) body(%d,%d) player_x=%d" \
                $rx $ry $bx $by [debug read memory $R_player_x]]
        }
    }
    debug cont
}

after time 6.000 {
    global A_launch
    debug set_bp $A_launch {} { launch_bp }
    # Cursor RIGHT: MSX key matrix row 8, bit 7. Walk the player toward the boss
    # so the rock spawn band lands on the body instead of the empty left column.
    keymatrixdown 8 0x80
    say "ARMED, holding RIGHT"
    debug cont
}

after time 30.000 {
    global timp_seen shot_taken near_miss R_player_x
    keymatrixup 8 0x80
    say [format "TOTALS timp_launches=%d shot=%d near_misses=%d player_x=%d" \
        $timp_seen $shot_taken $near_miss [debug read memory $R_player_x]]
    close $LOG
    after time 0.300 { exit }
}
