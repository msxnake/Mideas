# Claude probe: can the player's bullets even REACH the dual boss?
#
# Symbols from server/temp/claude_path_fix.sym (THIS build):
#   player_x 0xC001  player_y 0xC000
#   bitmap_bullet_check_enemy_collision 0x5520
#   bitmap_boss_zone_damage 0x6668
#   boss instance blocks 0xD11B / 0xD13D (active +0, x +1, y +2, hp +7)
#
# Holds the fire key and simply watches. Counts how many times the bullet code
# tests the boss and how many times the damage-zone check runs. If the zone
# check never runs, nothing ever overlapped the body and this is a geometry
# problem, not a damage bug.

set base "C:/Users/salam/Documents/Programacion/Mideas/server/temp/claude_kill_fixed"
carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/claude_zone_fix.rom"

set LOG [open "${base}.txt" w]
set checks 0
set zones 0
set seen 0

proc rb {a} { return [debug read memory $a] }

proc oncheck {} { incr ::checks }
proc onzone  {} { incr ::zones }

debug set_bp 0x5520 {} oncheck
debug set_bp 0x6668 {} onzone

# TAP fire, do not hold it: the shoot skill has a release lock, so a held key
# fires exactly once. This is what broke my first measurement.
proc tapdown {} { keymatrixdown 4 0x08; after time 0.06 tapup }
proc tapup   {} { keymatrixup   4 0x08; after time 0.14 tapdown }
after time 6.0 tapdown

proc look {} {
    global LOG seen checks zones
    if {[rb 0xC00B] == 255} { after time 0.1 look; return }
    incr seen
    puts $LOG [format "t%02d player=(%3d,%3d)  slot0 hp=%3d en (%3d,%3d)  slot1 hp=%3d en (%3d,%3d)  bullet_vs_enemy=%d  zone_check=%d" \
        $seen [rb 0xC001] [rb 0xC000] \
        [rb 0xD122] [rb 0xD11C] [rb 0xD11D] \
        [rb 0xD144] [rb 0xD13E] [rb 0xD13F] \
        $checks $zones]
    flush $LOG
    if {$seen == 12} { screenshot "${::base}.png" }
    if {$seen >= 16} { close $LOG; exit }
    after time 1.0 look
}

after time 7.0 look
after time 45 { exit }
