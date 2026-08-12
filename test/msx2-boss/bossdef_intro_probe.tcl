# Boots straight into the Boss room. Confirms the mandatory intro sequence
# (auto-walk to center, then Room Lock dispatch/dialogue/barrier) actually runs.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/bossdef_intro_probe.txt"
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
    logline [format "%-6s screen=%d boss_active=%d intro_state=%d intro_auto=%d player=(%d,%d)" \
        $tag [mem8 $SCREEN] [mem8 $BOSS_ACTIVE] [mem8 $INTRO_STATE] [mem8 $INTRO_AUTO] \
        [mem8 $PLAYER_X] [mem8 $PLAYER_Y]]
}

after time 1  { sample "t1" ; screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/bossdef_intro_t1.png" }
after time 2  { sample "t2" }
after time 3  { sample "t3" }
after time 4  { sample "t4" }
after time 5  { sample "t5" }
after time 6  { sample "t6" ; screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/bossdef_intro_t6.png" }
after time 8  { sample "t8" }
after time 10 { sample "t10" }
after time 12 { sample "t12" }
after time 14 { sample "t14" }
after time 16 { sample "t16" }
after time 18 { sample "t18" }
after time 22 { sample "t22" }
after time 26 { sample "t26" }
after time 30 {
    sample "t30"
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/bossdef_intro_probe.png"
    close $f
    exit
}
