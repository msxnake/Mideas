# Bat flight (movement mode 13) on real hardware.
#
# Room 0 (caverna1) is dark and holds two bats, each drawn as TWO overlapping
# hardware sprites (grey body layer + green eye layer) -> 4 pool slots:
#   slot 0/1 = bat A body/eyes, slot 2/3 = bat B body/eyes.
#
# What this checks:
#   1. The two layers of one bat never drift apart -- the reason the random turn
#      is hashed from the shared logical origin instead of drawn per slot.
#      A mismatch is re-read a frame later: reading WHILE bitmap_update_enemies
#      walks the pool catches one layer moved and the other not, which is a
#      sampling race, not a divergence. Only a mismatch that survives counts.
#   2. The bats change heading, and stay inside 0..240 / 0..176.
#   3. They fly THROUGH solid tiles: the collision map cell under the bat is
#      logged, and a solid one does not stop it.
#   4. The dark-room look still holds: body colour block 00 while unlit.
#
# The player is kept alive on purpose (bats deal contact damage and would
# otherwise send the game flow back to the intro mid-run).
#
# Usage: openmsx -machine C-BIOS_MSX2 -cart _bats.rom -romtype konami \
#            -script bats_fly.tcl

set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-bats"
set f [open "$dir/_bats_fly.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }

set POOL   0xD056
set STRIDE 25
set COUNT  0xD055
set SEED   0xD0BB
set SCREEN 0xC00B
set PLAYER_X 0xC001
set PLAYER_Y 0xC000
set HEALTH 0xC1FD
set COLLISION 0xC010
set LIGHT_X 0xD0D7
set LIGHT_Y 0xD0D8
set LIGHT_ACTIVE 0xD0DB
set LIGHT_ON 0xD0EB

proc rb {a} { debug read memory $a }
proc sb {a} { set v [debug read memory $a]; expr {$v > 127 ? $v - 256 : $v} }
proc vb {a} { debug read VRAM $a }

# Per-slot: x, y, dx, dy, pixels left before the next turn.
proc slot {i} {
    global POOL STRIDE
    set b [expr {$POOL + $i * $STRIDE}]
    return [list [rb $b] [rb [expr {$b+1}]] [sb [expr {$b+2}]] [sb [expr {$b+3}]] [rb [expr {$b+23}]]]
}

# 16x12 grid of 16px cells, indexed the way bitmap_probe_solid does it:
# (Y & #F0) + (X >> 4). Solid is bit #10; #40 is Deadly and #01 is HAS_SHAPE,
# neither of which blocks movement.
proc solid_under {x y} {
    global COLLISION
    set cell [expr {($y & 0xF0) + ($x >> 4)}]
    if {$cell < 0 || $cell > 191} { return "-" }
    return [expr {[rb [expr {$COLLISION + $cell}]] & 0x10 ? "SOLID" : "air"}]
}

set ::sync_errors 0
set ::bounds_errors 0
set ::solid_flights 0
set ::headings {}
set ::positions {}

proc same_pose {a b} {
    foreach i {0 1 2 3} {
        if {[lindex $a $i] != [lindex $b $i]} { return 0 }
    }
    return 1
}

proc report {tag} {
    global SCREEN PLAYER_X PLAYER_Y LIGHT_X LIGHT_Y COUNT SEED HEALTH
    set line "$tag scr=[rb $SCREEN] count=[rb $COUNT] seed=[rb $SEED] hp=[rb $HEALTH]"
    append line " player=[rb $PLAYER_X],[rb $PLAYER_Y] halo=[rb $LIGHT_X],[rb $LIGHT_Y]"
    L $line
    foreach {bat body eyes} {A 0 1 B 2 3} {
        set sb_ [slot $body]
        set se_ [slot $eyes]
        set sync "ok"
        if {![same_pose $sb_ $se_]} {
            # Re-read: a real divergence survives, a mid-update read does not.
            after time 0.05 [list recheck $tag $bat $body $eyes]
            set sync "recheck"
        }
        set bx [lindex $sb_ 0]; set by [lindex $sb_ 1]
        if {$bx > 240 || $by > 176} { incr ::bounds_errors }
        set cell [solid_under [expr {$bx + 8}] [expr {$by + 8}]]
        if {$cell eq "SOLID"} { incr ::solid_flights }
        set cvb [format %02X [vb [expr {0xF440 + $body * 16}]]]
        set cve [format %02X [vb [expr {0xF440 + $eyes * 16 + 6}]]]
        set lit [expr {$cvb eq "00" ? "DARK" : "LIT "}]
        L "   bat$bat at $bx,$by  d=[lindex $sb_ 2],[lindex $sb_ 3] left=[lindex $sb_ 4] $sync  under=$cell  body=$cvb eye=$cve $lit"
        dict set ::headings "$bat [lindex $sb_ 2],[lindex $sb_ 3]" 1
        dict set ::positions "$bat $bx,$by" 1
    }
}

proc recheck {tag bat body eyes} {
    set a [slot $body]
    set b [slot $eyes]
    if {[same_pose $a $b]} {
        L "   ($tag bat$bat mismatch was a mid-update read: now $a == $b)"
    } else {
        incr ::sync_errors
        L "   ($tag bat$bat REAL DESYNC: body=$a eyes=$b)"
    }
}

# Past the gameflow intro.
foreach t {3 4 5 6 7 8} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}] "keymatrixup 8 0x01"
}

# Keep the player alive: the bats hurt on contact and a death would restart the
# game flow half way through the run.
proc keep_alive {} {
    global HEALTH
    debug write memory $HEALTH 8
    after time 0.5 keep_alive
}
after time 9.5 keep_alive

for {set t 10} {$t <= 40} {incr t 2} {
    after time $t "report t$t"
}

after time 41 {
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-bats/_bats_dark_room.png"
}

# Park bat A dead centre of the halo so its body layer must come back, while
# bat B stays out in the dark as a pair of floating eyes. Enemy Y is the game
# band coordinate, the halo is in screen rows, hence the 20px HUD offset.
#
# The player's glowing tail starts unlit in this project (it is fed by the
# mushrooms), so the halo is switched on from RAM instead of walking the player
# to a mushroom: this checks the ENEMY side of the test, not the torch skill.
after time 41.2 {
    debug write memory $LIGHT_ON 1
    debug write memory $LIGHT_ACTIVE 1
    set hx [expr {[rb $LIGHT_X] - 8}]
    set hy [expr {[rb $LIGHT_Y] - 20 - 8}]
    foreach s {0 1} {
        debug write memory [expr {$POOL + $s * $STRIDE}] $hx
        debug write memory [expr {$POOL + $s * $STRIDE + 1}] $hy
    }
}
after time 41.25 {
    report "lit-check"
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-bats/_bats_lit_room.png"
}

# Visual pair: both bats parked side by side in open air, photographed once with
# the tail out (eyes only) and once with it lit (whole bat). Same coordinates in
# both shots so the two PNGs can be compared pixel for pixel.
proc park {slotpair x y} {
    global POOL STRIDE
    foreach s $slotpair {
        debug write memory [expr {$POOL + $s * $STRIDE}] $x
        debug write memory [expr {$POOL + $s * $STRIDE + 1}] $y
        debug write memory [expr {$POOL + $s * $STRIDE + 2}] 0   ; dx = 0
        debug write memory [expr {$POOL + $s * $STRIDE + 3}] 0   ; dy = 0: hold still
        debug write memory [expr {$POOL + $s * $STRIDE + 23}] 255
    }
}
after time 41.8 {
    debug write memory $LIGHT_ON 0
    debug write memory $LIGHT_ACTIVE 0
    park {0 1} 96 64
    park {2 3} 144 64
}
after time 41.9 {
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-bats/_bats_pair_dark.png"
}
after time 42.0 {
    # Light the tail and drag the halo over both bats.
    debug write memory $LIGHT_ON 1
    debug write memory $LIGHT_ACTIVE 1
    debug write memory $LIGHT_X 128
    debug write memory $LIGHT_Y 92
    park {0 1} 96 64
    park {2 3} 144 64
}
after time 42.1 {
    report "pair-lit"
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-bats/_bats_pair_lit.png"
}

after time 42.3 {
    report "final"
    L ""
    L "real layer desyncs: $::sync_errors (must be 0)"
    L "out-of-bounds samples: $::bounds_errors (must be 0)"
    L "samples with the bat centre inside a SOLID cell: $::solid_flights (proves tiles are ignored)"
    L "distinct headings seen: [dict size $::headings] of 8"
    L "distinct positions seen: [dict size $::positions]"
    close $f
    exit
}
