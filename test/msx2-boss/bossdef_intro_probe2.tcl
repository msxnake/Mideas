set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/bossdef_intro_probe2.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }

set BOSS_ACTIVE 0xD08E
set INTRO_STATE 0xD0DA
set INTRO_AUTO  0xD0DF
set SCREEN      0xC00B
set PLAYER_X    0xC001
set PLAYER_Y    0xC000

proc sample {tag} {
    global BOSS_ACTIVE INTRO_STATE INTRO_AUTO SCREEN PLAYER_X PLAYER_Y
    logline [format "%-6s screen=%d boss_active=%d intro_state=%d intro_auto=%d player=(%d,%d)" $tag \
        [mem8 $SCREEN] [mem8 $BOSS_ACTIVE] [mem8 $INTRO_STATE] [mem8 $INTRO_AUTO] \
        [mem8 $PLAYER_X] [mem8 $PLAYER_Y]]
}

for {set i 1} {$i <= 60} {incr i} {
    after time $i "sample t$i"
}
after time 61 { close $f; exit }
