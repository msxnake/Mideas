# How long does the song go untouched, and at which room change?
#
# WHY THIS EXISTS: the music stutter on screen changes was blamed on the boss
# window upload (FASE 4). It is not: ordinary room transitions stall it too.
#
# music_update is the LAST call of the main loop, once per iteration, so a gap
# between two calls IS a long loop iteration -- the song is a readout of the
# frame time, not a separate problem.
#
# MEASURED on test/msx2-boss/out/per_world_atlas.rom (Konami SCC MegaROM,
# OpenMSX, emulated time), 2026-08-19:
#
#   ordinary room transition (0->1, 1->2)   ~5 frames   (85 ms)
#   WorldLink crossing (world -> world)     34.7 frames (580 ms)
#   entering the boss room                  18.3 frames (305 ms)
#   inside the boss room, permanently       loop iterations of ~3.6 frames
#                                           (312 of them in 40 s: ~16 fps)
#
# NOT yet measured: whether a DARK room transition costs more than a lit one.
# The rooms sampled above (0, 1, 2, 19, 20) are all lit.
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
