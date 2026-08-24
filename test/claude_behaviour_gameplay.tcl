# Gameplay capture: an AVI to watch, plus a dense PNG burst to animate.
#
# The earlier probes sampled once a second, which is a slideshow, not gameplay.
# This one grabs a frame every 0.1s for ~5 seconds, which is fast enough for the
# eye to read it as motion, and records an AVI alongside for sound and full rate.
#
# The AVI is wrapped in catch: not every openMSX build ships video recording,
# and a missing feature must not take the PNG burst down with it.
#
#   player_y #C000, player_x #C001
#   bitmap_enemy_count #D0D3, pool #D0D4 stride 30, mode +13
#   fire key N = row 4 bit 3.  RIGHT = row 8 bit 0x80

set CASE [lindex $::env(MIDEAS_CASE) 0]
set OUTDIR "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual"
set LOG [open "$OUTDIR/${CASE}_gameplay.txt" w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set POOL   0xD0D4
set STRIDE 30
set shots 0
set armed 0
set slotIndex 0
set recording 0

proc rb {a} { return [debug read memory $a] }
proc slot {i off} { return [rb [expr {$::POOL + $i * $::STRIDE + $off}]] }

proc finish {why} {
    if {$::recording} { catch { record stop } }
    catch { keymatrixup 8 0x80 }
    catch { keymatrixup 4 0x08 }
    say "result=$why shots=$::shots recording=$::recording"
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
    if {$i < 0} { after time 0.25 arm; return }
    set ::armed 1
    set ::slotIndex $i
    if {![catch { record start "$::OUTDIR/${::CASE}_gameplay.avi" }]} { set ::recording 1 }
    say "instrument OK: slot=$i mode=[slot $i 13] recording=$::recording"
    say ""
    say "  f | plyX plyY | enX enY dx st"
    keymatrixdown 8 0x80
    after time 0.2 tick
}

proc tick {} {
    global slotIndex
    incr ::shots
    screenshot -raw [format "%s/gp_%s_%03d.png" $::OUTDIR $::CASE $::shots]
    if {$::shots % 5 == 0} {
        say [format "%3d | %4d %4d | %3d %3d %3d %2d" \
            $::shots [rb 0xC001] [rb 0xC000] [slot $slotIndex 0] [slot $slotIndex 1] \
            [slot $slotIndex 2] [slot $slotIndex 25]]
    }
    # Tap the fire key now and then once the player is on its way.
    if {$::shots > 20 && $::shots % 10 == 0} {
        keymatrixdown 4 0x08
        after time 0.08 { catch { keymatrixup 4 0x08 } }
    }
    if {$::shots >= 50} { finish "COMPLETE" }
    after time 0.1 tick
}

after time 4.0 arm
after time 40.0 { if {!$::armed} { finish "FAILED-INSTRUMENT" } }
