# Animated boss death explosions smoke.
#
# The bullet-poke kill used by boss_kill.tcl no longer lands (its own log shows
# the boss surviving), so this drives the real death runtime from the exact
# state bitmap_boss_kill leaves behind: active = 2, left = blast count, tick = 1,
# a non-zero PRNG seed and three free slots.
#
# What must show up:
#   - slots turn active with frame indices walking 0,1,2 and then freeing,
#   - at most ONE slot advances per frame (the VDP budget rule),
#   - boss_death_left counts the authored 10 blasts down, parks at #FF for the
#     final hold and then boss_active reaches 0 (finalized),
#   - the player keeps moving while all of that happens.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_death_mixed_bl.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }

set BOSS_ACTIVE 0xD08E
set BOSS_X      0xD08F
set BOSS_Y      0xD090
set BOSS_HP     0xD095
set DEATH_LEFT  0xD0C5
set DEATH_TICK  0xD0C6
set DEATH_SEED  0xD0C7
set SLOTS       0xD0C8
set PLAYER_Y    0xC000
set PLAYER_X    0xC001

proc slots {} {
    global SLOTS
    set out ""
    for {set i 0} {$i < 3} {incr i} {
        set b [expr {$SLOTS + $i * 5}]
        append out [format " s%d(a=%d f=%d t=%d x=%d y=%d)" $i \
            [mem8 $b] [mem8 [expr {$b + 1}]] [mem8 [expr {$b + 2}]] \
            [mem8 [expr {$b + 3}]] [mem8 [expr {$b + 4}]]]
    }
    return $out
}
proc sample {tag} {
    global BOSS_ACTIVE DEATH_LEFT DEATH_TICK PLAYER_X PLAYER_Y
    logline [format "%s active=%d left=%d tick=%d px=%d py=%d |%s" $tag \
        [mem8 $BOSS_ACTIVE] [mem8 $DEATH_LEFT] [mem8 $DEATH_TICK] \
        [mem8 $PLAYER_X] [mem8 $PLAYER_Y] [slots]]
}

# boot through the main menu
foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}

after time 12.0 { sample "alive" ; screenshot -prefix mixed_bl_alive_ }

# Start the death presentation exactly as bitmap_boss_kill does.
after time 12.5 {
    debug write memory 0xD0C5 6      ;# boss_death_left = authored blast count
    debug write memory 0xD0C6 1       ;# boss_death_tick = first blast next frame
    debug write memory 0xD0C7 0xA5    ;# boss_death_seed (must not be zero)
    debug write memory 0xD0C8 0
    debug write memory 0xD0CD 0
    debug write memory 0xD0D2 0
    debug write memory 0xD08E 2       ;# boss_active = death FX
    logline "started death FX"
}
# The player must keep responding while the boss dies.
after time 12.6 "keymatrixdown 8 0x80"
after time 14.6 "keymatrixup 8 0x80"

# One sample per game frame through the whole sequence.
for {set i 0} {$i < 240} {incr i} {
    after time [expr {12.55 + $i * 0.0167}] "sample fx[format %03d $i]"
}
after time 12.8 { screenshot -prefix mixed_bl_blast_ }
after time 13.6 { screenshot -prefix mixed_bl_mid_ }
after time 17.5 {
    sample "after"
    screenshot -prefix mixed_bl_done_
    after time 1 { exit }
}
