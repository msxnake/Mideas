# Bullet vs boss damage zones (SCREEN 5 bitmap room), single-bullet trace.
#
# Injects ONE bullet into the shoot pool instead of driving the player, so the
# path is exact and the frame it dies is visible:
#   BODY shot -> centre at boss-local y 48, misses both eyes.
#   EYE  shot -> centre at boss-local y 24, crosses eye_l (local x 17..26, x2).
#
# Against fixture_boss_def_passthru (eyes only) the BODY bullet must cross the
# whole body still active and leave boss_hp alone. Against fixture_boss_def
# (eyes + full-body armour) the same bullet must die inside the body instead.
#
# Build a ROM, then run it:
#   python ../../scripts/build_mideas_unified_rom.py --json fixture_boss_def_passthru.json \
#       --project-root ../.. --asm-output _zdefp.asm --rom-output _zdefp.rom \
#       --allow-tsc-errors --rom-mode megarom --target-format konami
#   ZONE_TAG=passthru openmsx -machine C-BIOS_MSX2 -cart _zdefp.rom \
#       -romtype KonamiSCC -script zone_passthru.tcl
#
# The RAM addresses below come from the .sym of that build; re-read them if the
# generator's RAM layout moves. Logs land in _zone_$ZONE_TAG.txt.

set tag $::env(ZONE_TAG)
set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_zone_$tag.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }

set BOSS_ACTIVE 0xD08E
set BOSS_X      0xD08F
set BOSS_Y      0xD090
set BOSS_HP     0xD095
set POOL        0xC0DA

proc rb {a} { debug read memory $a }

# Bullet slot 0: active, x, y, dir (1 = right, 4 px/frame). Collision uses the
# bullet CENTRE, i.e. (x+8, y+8).
proc fire {x y} {
    global POOL
    debug write memory $POOL 1
    debug write memory [expr {$POOL + 1}] [expr {$x & 0xFF}]
    debug write memory [expr {$POOL + 2}] [expr {$y & 0xFF}]
    debug write memory [expr {$POOL + 3}] 1
}

# Get past the boss intro prelude the same way the other boss probes do.
foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}

set phase wait
set frames 0
set shot ""

proc tick {} {
    global phase frames shot BOSS_ACTIVE BOSS_X BOSS_Y BOSS_HP POOL
    set bx [rb $BOSS_X]
    set by [rb $BOSS_Y]
    set hp [rb $BOSS_HP]
    set act [rb $BOSS_ACTIVE]

    # The main loop only steps bullets once the boss intro has let the player
    # go (auto-walk done, no wait/chain/dialogue step pending).
    set intro [rb 0xD0DA]
    set walk [rb 0xD0DF]

    if {$phase eq "wait"} {
        incr frames
        if {$frames % 120 == 1} { L "wait f$frames act=$act intro=$intro walk=$walk bx=$bx by=$by hp=$hp" }
        # The intro prelude freezes the player (and with it the bullet step).
        # Nothing here tests the intro, so once the boss is up, end it by hand.
        if {$act == 1 && $frames > 660} {
            debug write memory 0xD0DA 0
            debug write memory 0xD0DF 0
        }
        if {$act == 1 && $intro == 0 && $walk == 0 && $frames > 780} {
            set shot BODY
            L "boss up: x=$bx y=$by hp=$hp"
            L "--- BODY shot: x=[expr {$bx - 24}] y=[expr {$by + 40}] dir=right (centre local y 48)"
            fire [expr {$bx - 24}] [expr {$by + 40}]
            set phase trace
            set frames 0
        }
    } else {
        incr frames
        set a [rb $POOL]
        set x [rb [expr {$POOL + 1}]]
        L "$shot f$frames active=$a bullet_x=$x local_cx=[expr {$x + 8 - $bx}] boss_x=$bx hp=$hp"
        if {$frames >= 24} {
            if {$shot eq "BODY"} {
                set shot EYE
                # The eye band sits at screen y 44..51 where this room has a
                # solid tile row, and the wall probe kills the bullet before
                # the boss ever sees it. Drop the boss 24 px so the eyes land
                # on the same free row the body shot flew through.
                debug write memory 0xD090 56
                set by 56
                L "--- EYE shot: x=[expr {$bx - 24}] y=[expr {$by + 16}] dir=right (centre local y 24, boss_y forced to 56)"
                fire [expr {$bx - 24}] [expr {$by + 16}]
                set frames 0
            } else {
                L "final hp=$hp active=$act"
                global f
                close $f
                exit
            }
        }
    }
    after frame tick
}

after frame tick
after time 60 { L "TIMEOUT" ; exit }
