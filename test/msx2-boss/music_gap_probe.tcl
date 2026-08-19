# How long does the song go untouched, and at which room change?
#
# WHY THIS EXISTS: the music stutter on screen changes was blamed on the boss
# window upload (FASE 4). It is not: ordinary room transitions stall it too, and
# the biggest stall by far is not a room change at all but a WorldLink crossing.
#
# music_update is the LAST call of the main loop, once per iteration, so a gap
# between two calls IS a long loop iteration -- the song is a readout of the
# frame time, not a separate problem.
#
# MEASURED on test/msx2-boss/out/per_world_atlas.rom (Konami SCC MegaROM,
# OpenMSX, emulated time), 2026-08-19. Figures reproduced across three runs:
#
#   plain gameplay, no transition (room 0, 8 s)  NO gap over 1.8 frames
#   ordinary room transition (0->1, 1->2)        ~5 frames    (85 ms)
#   entering the boss room                       18.3 frames  (305 ms)  x2 runs
#   WorldLink crossing (world -> world)          34.6 / 34.7 / 35.2 frames
#   inside the boss room, permanently            iterations of ~3.6 frames
#
# So the engine holds 60 Hz while playing, and loses it in three places: the
# room commit, the world change, and the boss body repaint.
#
# NOT MEASURED: whether a DARK room transition costs more than a lit one. Every
# room this route reaches (0, 1, 2, 19, 20) is lit; the lamp-lit rooms of this
# fixture are 14..18 and the walk never reaches them. Do not quote this probe as
# evidence about dark rooms.
#
# Room 1 also showed 4..10 frame gaps during play, but only on a route that
# pressed UP next to an NPC (the dialogue typewriter is the obvious suspect).
# UNCONFIRMED: the control run took a different path and never entered room 1.
#
set out $::env(GAPOUT)
set f [open $out "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
logline "START"

set FRAME [expr {1.0 / 60.0}]
set ::last_t -1
set ::room -1

proc on_music {} {
    set t [machine_info time]
    if {$::last_t >= 0} {
        set gap [expr {($t - $::last_t) / $::FRAME}]
        if {$gap > 1.8} {
            logline [format "  t=%6.2f  GAP %5.1f frames   room %d" $t $gap [debug read memory 0xC00B]]
        }
    }
    set ::last_t $t
}
debug set_bp 0x4813 {} {on_music}

proc watch_room {} {
    set r [debug read memory 0xC00B]
    if {$r != $::room} {
        logline [format "t=%6.2f  --- ROOM %d -> %d" [machine_info time] $::room $r]
        set ::room $r
    }
    after time 0.05 watch_room
}
after time 12 { watch_room }

# Skip the presentation.
for {set t 3} {$t < 12} {incr t} {
    after time $t                "keymatrixdown 8 0x01"
    after time [expr {$t + 0.4}] "keymatrixup 8 0x01"
}
# Long walk right, then left, then right again: crosses boundaries repeatedly
# in both directions instead of relying on one lucky crossing.
for {set t 14} {$t < 34} {incr t} {
    after time $t                "keymatrixdown 8 0x80"
    after time [expr {$t + 0.9}] "keymatrixup 8 0x80"
}
for {set t 34} {$t < 50} {incr t} {
    after time $t                "keymatrixdown 8 0x40"
    after time [expr {$t + 0.9}] "keymatrixup 8 0x40"
}
for {set t 50} {$t < 64} {incr t} {
    after time $t                "keymatrixdown 8 0x80"
    after time [expr {$t + 0.9}] "keymatrixup 8 0x80"
}
after time 66 { logline "DONE" ; exit 0 }
after time 80 { logline "TIMEOUT" ; exit 1 }
