# Boot window + long auto-walk observation window, all scheduled up front
# (matches the proven pattern from the death-FX probes: flat "after time"
# events, not recursive "after frame" loops, which gave inconsistent results).
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/bossdef_intro_frames.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }

set INTRO_STATE 0xD0DA
set INTRO_AUTO  0xD0DF
set PLAYER_X    0xC001
set PLAYER_Y    0xC000
set MOVING      0xC00A
set FACING      0xC008
set BOSS_ACTIVE 0xD08E

proc sample {tag} {
    global INTRO_STATE INTRO_AUTO PLAYER_X PLAYER_Y MOVING FACING BOSS_ACTIVE
    logline [format "%-6s state=%d auto=%d x=%d y=%d mov=%d face=%d bossact=%d" $tag \
        [mem8 $INTRO_STATE] [mem8 $INTRO_AUTO] [mem8 $PLAYER_X] [mem8 $PLAYER_Y] \
        [mem8 $MOVING] [mem8 $FACING] [mem8 $BOSS_ACTIVE]]
}

foreach t {12 12.5 13 13.5 14 14.5 15 15.5 16 17 18 20 25 30 35 40 45 50} {
    after time $t "sample t$t"
}
after time 51 { close $f; exit }
