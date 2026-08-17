# Reach room 5 ("caverna1 Este Norte Norte Norte Norte", lighting = off) the way
# the game does: through the five DARK rooms below it. Room 0 -east-> 1
# -north-> 2 -north-> 3 -north-> 4 -north-> 5.
#
# Climbing is not the point here, so each rail is triggered by shoving the
# player onto the edge the engine tests (player_x high for east, player_y ~0 for
# north) and letting commit_room_flip do the rest untouched.
#
# Dumps SCREEN 5 page 0 AND page 1 once room 5 is on screen, plus the lighting
# state, so the result can be diffed against the authored composition.

set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/t501"
set f [open "$dir/_walk_r5.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }

set PLAYER_Y 0xC000
set PLAYER_X 0xC001
set SCREEN   0xC00B
set PAGE     0xC0D0
set LIGHT_ACTIVE 0xD08E

proc scr {} { debug read memory 0xC00B }

proc state {tag} {
    L "$tag screen=[scr] page=[debug read memory 0xC0D0]\
 player=[debug read memory 0xC001],[debug read memory 0xC000]\
 light_active=[debug read memory 0xD08E]\
 plat_light=[debug read memory 0xD087],[debug read memory 0xD088]"
}

proc dump_page {path page} {
    set out [open $path "w"]
    set base [expr {$page * 0x8000}]
    for {set y 0} {$y < 256} {incr y} {
        set line ""
        set row [expr {$base + $y * 128}]
        for {set x 0} {$x < 128} {incr x} {
            append line [format %02X [debug read VRAM [expr {$row + $x}]]]
        }
        puts $out $line
    }
    close $out
}

# Past the intro.
foreach t {3 4 5 6 7 8} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}] "keymatrixup 8 0x01"
}

set ::done 0

# Every few frames, shove the player at whichever edge leads onward.
proc nudge {} {
    if {$::done} return
    set s [scr]
    # East fires from inside the "moved right this frame" path, so RIGHT is held
    # down and the player is only shoved next to the edge. North fires on a
    # WRAPPED y (>= 192 means the up-move went negative), not on y < 2.
    switch -- $s {
        0 { keymatrixdown 8 0x80; debug write memory 0xC001 239 }
        1 { keymatrixup 8 0x80; debug write memory 0xC000 0xFE }
        2 { debug write memory 0xC000 0xFE }
        3 { debug write memory 0xC000 0xFE }
        4 { debug write memory 0xC000 0xFE }
        5 {
            # Arrived. Let the room settle for a second, then photograph it.
            set ::done 1
            state "arrived"
            # Let the two moving platforms run their patrols: a lighting-aware
            # background repair that takes the wrong branch shows up as a trail.
            after time 12 {
                state "settled"
                dump_page "$::dir_page0" 0
                dump_page "$::dir_page1" 1
                screenshot "$::dir_shot"
                state "dumped"
                close $::f
                exit
            }
            return
        }
    }
    after time 0.05 nudge
}

set ::dir_page0 "$dir/_walk_r5_page0.txt"
set ::dir_page1 "$dir/_walk_r5_page1.txt"
set ::dir_shot  "$dir/_walk_r5.png"
set ::f $f
set ::dir $dir

after time 10 nudge

after time 90 {
    L "TIMEOUT screen=[scr]"
    state "timeout"
    screenshot "$dir/_walk_r5_timeout.png"
    close $f
    exit
}
