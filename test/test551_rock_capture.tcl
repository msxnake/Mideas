# Visual A/B for the falling-rock projectile of the test551 "tuneladora" boss.
#
# WHY IT PATCHES AT RUNTIME
#   The fix under discussion is one byte: the op the boss projectile launches
#   with. #98 = LMMM + TIMP (colour 0 transparent), #D0 = HMMM (opaque). Instead
#   of editing the generator -- which belongs to the other agent in this
#   exchange -- this probe rewrites boss_cmd_buf+14 at the launch site, after
#   the routine has filled the block and before the OTIR streams it to the VDP.
#   Same ROM, same frame, one byte different: that is a real A/B, not two builds
#   that may differ in a dozen other ways.
#
#   ROCK_PATCH=1 in the environment -> force #D0 (what it looked like before
#   commit 706ef5e6). Unset -> leave #98 (what ships today).
#
# OUTPUT: one screenshot taken while a rock is in mid-fall, plus the command
#   block that drew it, so the capture can be tied to a specific rectangle.

set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set OUTDIR  "C:/Users/salam/AppData/Local/Temp/mideas-test551"

set PATCH 0
if {[info exists ::env(ROCK_PATCH)] && $::env(ROCK_PATCH) eq "1"} { set PATCH 1 }
set TAG [expr {$PATCH ? "hmmm" : "timp"}]

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
set R_proj_on [sym boss_proj_active]

say "MODE $TAG (PATCH=$PATCH: 1 = force opaque HMMM, 0 = ship-as-is TIMP)"

set timp_seen 0
set shot_taken 0

proc launch_bp {} {
    global R_cmd_buf PATCH timp_seen shot_taken OUTDIR TAG R_proj_x R_proj_y
    set opaddr [expr {$R_cmd_buf + 14}]
    set op [debug read memory $opaddr]
    if {$op == 0x98} {
        incr timp_seen
        if {$PATCH} { debug write memory $opaddr 0xD0 }
        # Capture once the rock is well clear of the ceiling, so the screenshot
        # shows it over room art and not over the tile it spawned in.
        if {!$shot_taken && [debug read memory $R_proj_y] > 90} {
            set shot_taken 1
            proc w {a} { return [expr {[debug read memory $a] | ([debug read memory [expr {$a+1}]] << 8)}] }
            set b $R_cmd_buf
            say [format "CAPTURE at rock x=%d y=%d  block SX=%d SY=%d -> DX=%d DY=%d NX=%d NY=%d op=%02X" \
                [debug read memory $R_proj_x] [debug read memory $R_proj_y] \
                [w $b] [w [expr {$b+2}]] [w [expr {$b+4}]] [w [expr {$b+6}]] \
                [w [expr {$b+8}]] [w [expr {$b+10}]] [debug read memory $opaddr]]
            # Let the command finish and the frame reach the screen.
            after time 0.040 {
                global OUTDIR TAG
                screenshot "$OUTDIR/rock-$TAG.png"
                say "shot -> $OUTDIR/rock-$TAG.png"
            }
        }
    }
    debug cont
}

after time 6.000 {
    global A_launch
    debug set_bp $A_launch {} { launch_bp }
    say "ARMED"
    debug cont
}

after time 26.000 {
    global timp_seen shot_taken R_proj_on
    say [format "TOTALS timp_launches=%d shot_taken=%d proj_active=%d" \
        $timp_seen $shot_taken [debug read memory $R_proj_on]]
    close $LOG
    after time 0.300 { exit }
}
