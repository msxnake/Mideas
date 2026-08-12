# Wait (frame-driven) until the boss room is live, then log player_x every frame
# for 80 frames to see whether the mandatory auto-walk actually moves the player.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/bossdef_walk.txt"
set f [open $log_path "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc M {a} { return [debug read memory $a] }

set BOSS_ACTIVE 0xD08E
set INTRO_STATE 0xD0DA
set INTRO_AUTO  0xD0DF
set SCREEN      0xC00B
set PLAYER_X    0xC001
set PLAYER_Y    0xC000

set phase wait
set count 0
proc tick {} {
    global phase count BOSS_ACTIVE INTRO_STATE INTRO_AUTO SCREEN PLAYER_X PLAYER_Y f
    set scr [M $SCREEN]
    set ba  [M $BOSS_ACTIVE]
    if {$phase eq "wait"} {
        if {$scr != 255 && $ba != 0} {
            set phase log
            L "LIVE reached: screen=$scr boss_active=$ba"
        }
    }
    if {$phase eq "log"} {
        L [format "f%03d state=%d auto=%d x=%d y=%d" $count [M $INTRO_STATE] [M $INTRO_AUTO] [M $PLAYER_X] [M $PLAYER_Y]]
        incr count
        if {$count >= 80} { L "DONE"; close $f; exit }
    }
    after frame tick
}
tick
