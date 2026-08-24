# Same visual check, but with somebody at the controls.
#
# WHY THIS EXISTS: the first pass never touched the keyboard, so the player
# stood on its spawn tile for the whole run. Three of the behaviours only do
# anything when the player is near or shooting — chaser, guard and shielded —
# so that pass could not tell "the behaviour does not work" apart from "nobody
# came". A probe that cannot distinguish those two is not evidence.
#
# The player walks RIGHT towards the enemy, and from halfway on taps N, which
# is the fire key this project emits (row 4, bit 3; read at bitmap_shoot_pressed).
# N is tapped, not held: the shot fires on the press EDGE, so holding it down
# would produce exactly one bullet and then silence.
#
#   player_y #C000, player_x #C001
#   bitmap_enemy_count #D0D3, pool #D0D4 stride 30, mode +13
#   bitmap_enemy_script_step 0x60D0

set CASE [lindex $::env(MIDEAS_CASE) 0]
set OUTDIR "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual"
set LOG [open "$OUTDIR/${CASE}_interactive.txt" w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set POOL   0xD0D4
set STRIDE 30
set steps 0
set shots 0
set armed 0
set slotIndex 0

proc rb {a} { return [debug read memory $a] }
proc slot {i off} { return [rb [expr {$::POOL + $i * $::STRIDE + $off}]] }

debug set_bp 0x60D0 {} { incr ::steps }
say "case=$CASE (interactive)"

proc finish {why} {
    catch { keymatrixup 8 0x80 }
    catch { keymatrixup 4 0x08 }
    say "result=$why steps=$::steps shots=$::shots"
    close $::LOG
    exit
}

proc scripted_slot {} {
    set count [rb 0xD0D3]
    for {set i 0} {$i < $count} {incr i} {
        if {[slot $i 13] == 14} { return $i }
    }
    return -1
}

proc arm {} {
    set i [scripted_slot]
    if {$i < 0 || $::steps == 0} { after time 0.25 arm; return }
    set ::armed 1
    set ::slotIndex $i
    say "instrument OK: slot=$i mode=[slot $i 13] prog=[slot $i 24] speed=[slot $i 21] interval=[slot $i 22]"
    say ""
    say "  s | plyX plyY | enX enY dx st | dist | steps"
    keymatrixdown 8 0x80    ;# hold RIGHT, and keep holding: the player has to
                            ;# cover most of the room before any sight rule can fire
    after time 0.5 tick
}

# Tap, do not hold: press for ~4 frames then release, so every tap is one edge.
proc fire_tap {} {
    keymatrixdown 4 0x08
    after time 0.08 { catch { keymatrixup 4 0x08 } }
}

proc tick {} {
    global slotIndex
    incr ::shots
    screenshot -raw [format "%s/%s_int_%02d.png" $::OUTDIR $::CASE $::shots]
    set px [rb 0xC001]
    set py [rb 0xC000]
    set ex [slot $slotIndex 0]
    set dist [expr {abs($px - $ex)}]
    say [format "%3d | %4d %4d | %3d %3d %3d %2d | %4d | %5d" \
        $::shots $px $py $ex [slot $slotIndex 1] [slot $slotIndex 2] [slot $slotIndex 25] \
        $dist $::steps]
    if {$::shots >= 5} { fire_tap }
    if {$::shots >= 14} { finish "COMPLETE" }
    after time 1.0 tick
}

after time 4.0 arm
after time 40.0 { if {!$::armed} { finish "FAILED-INSTRUMENT" } }
