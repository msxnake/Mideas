# Diagnostic: where does the bullet die, and is bitmap_enemy_bullet_hit reached?
#
# The bullet is injected directly into its pool slot right next to a parked bat,
# which takes the spawn code and the wall probe out of the picture: whatever
# happens next is the enemy check alone.

set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-bats"
set f [open "$dir/_bats_shoot_diag.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }

set POOL     0xD056
set STRIDE   26
set COUNT    0xD055
set PLAYER_X 0xC001
set PLAYER_Y 0xC000
set HEALTH   0xC1FD
set BULLET   0xC0DA
set COLLISION 0xC010

proc rb {a} { debug read memory $a }
proc mode {i} { global POOL STRIDE; return [rb [expr {$POOL + $i * $STRIDE + 13}]] }
proc pool {i o} { global POOL STRIDE; return [rb [expr {$POOL + $i * $STRIDE + $o}]] }
proc setpool {i o v} { global POOL STRIDE; debug write memory [expr {$POOL + $i * $STRIDE + $o}] $v }
proc bullet {} {
    global BULLET
    return [list [rb $BULLET] [rb [expr {$BULLET+1}]] [rb [expr {$BULLET+2}]] [rb [expr {$BULLET+3}]] [rb [expr {$BULLET+4}]]]
}
proc cell {x y} {
    global COLLISION
    set c [expr {($y & 0xF0) + ($x >> 4)}]
    if {$c < 0 || $c > 191} { return "-" }
    return [format "%02X" [rb [expr {$COLLISION + $c}]]]
}

foreach t {3 4 5 6 7 8} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}] "keymatrixup 8 0x01"
}
proc keep_alive {} { global HEALTH; debug write memory $HEALTH 8; after time 0.25 keep_alive }
after time 9.5 keep_alive

# Count how often the enemy check actually runs, and what it sees on entry.
set ::hits 0
after time 10.5 {
    debug set_bp 0x81F0 {} {
        incr ::hits
        if {$::hits <= 6} {
            L "  enter bitmap_enemy_bullet_hit  IX=[format %04X [reg IX]] count=[rb 0xD055] bullet=[bullet]"
            L "    slot0 x=[pool 0 0] y=[pool 0 1] mode=[pool 0 13] xoff=[pool 0 14] yoff=[pool 0 15]"
        }
    }
}

# Park bat A well clear of walls, hold it still.
proc park {slotpair x y} {
    foreach s $slotpair {
        setpool $s 0 $x
        setpool $s 1 $y
        setpool $s 2 0
        setpool $s 3 0
        setpool $s 24 255
    }
}

after time 11 {
    L "player=[rb $PLAYER_X],[rb $PLAYER_Y] count=[rb $COUNT]"
    for {set i 0} {$i < 4} {incr i} {
        L "  slot$i x=[pool $i 0] y=[pool $i 1] mode=[pool $i 13] xoff=[pool $i 14] yoff=[pool $i 15] dmg=[pool $i 16]"
    }
    park {0 1} 120 100
    L "cells around the bat: [cell 120 100] [cell 112 100] [cell 128 100]"
}

# Inject a bullet 4px to the left of the bat: after its one 4px step it is
# exactly on top of it, so nothing but the enemy check can decide the outcome.
after time 11.5 {
    park {0 1} 120 100
    debug write memory [expr {$BULLET+1}] 116   ;# x
    debug write memory [expr {$BULLET+2}] 100   ;# y
    debug write memory [expr {$BULLET+3}] 1     ;# dir = right
    debug write memory [expr {$BULLET+4}] 20    ;# life
    debug write memory $BULLET 1                ;# active last
    L "injected bullet=[bullet]  bat=[pool 0 0],[pool 0 1]"
}
after time 11.55 { L "t+1f  bullet=[bullet] mode0=[mode 0] mode1=[mode 1] batpos=[pool 0 0],[pool 0 1]" }
after time 11.7  { L "t+     bullet=[bullet] mode0=[mode 0] mode1=[mode 1]" }
after time 12.5  { L "after  bullet=[bullet] mode0=[mode 0] mode1=[mode 1] mode2=[mode 2] mode3=[mode 3]" }
after time 13 {
    L "enemy-check entries seen: $::hits"
    close $f
    exit
}
