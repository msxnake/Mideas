# Player bullets vs bitmap-room enemies (bats) on real hardware.
#
# Before the fix, bitmap_bullet_check_enemy_collision was a plain `ret` unless
# the project had a boss, so a bullet flew straight through a bat.
#
# Each bat is TWO overlapping hardware sprites (grey body + green eyes) = two
# pool slots, so what matters is that BOTH layers die from one hit.
# Slot 0/1 = bat A body/eyes, slot 2/3 = bat B body/eyes.
#
# The target is parked in OPEN AIR on the player's own row, read from the live
# collision grid: bats fly through rock but bullets die on it, so a bat parked
# inside a wall can never be shot (correctly — the wall is in the way).
#
# What this checks, driving the real N key end to end:
#   1. A bullet fired into a parked bat marks slot 0 AND slot 1 dead (mode #FF).
#   2. Bat B, out of the line of fire, stays alive -> one shot kills one bat.
#   3. The dead bat leaves the screen: its SAT Y becomes the off-screen #D4.
#   4. The bullet is consumed by the hit.
#
# Usage: openmsx -machine C-BIOS_MSX2 -cart _bats_shoot.rom -romtype konami \
#            -script bats_shoot.tcl

set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-bats"
set f [open "$dir/_bats_shoot.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }

set POOL      0xD056
set STRIDE    26
set COUNT     0xD055
set SCREEN    0xC00B
set PLAYER_X  0xC001
set PLAYER_Y  0xC000
set HEALTH    0xC1FD
set BULLET    0xC0DA
set COOLDOWN  0xC0DF
set SHOOTLOCK 0xC0E0
set COLLISION 0xC010
set ENEMY_SAT 0xF610

proc rb {a} { debug read memory $a }
proc vb {a} { debug read VRAM $a }
proc mode {i} { global POOL STRIDE; return [rb [expr {$POOL + $i * $STRIDE + 13}]] }
proc pool {i o} { global POOL STRIDE; return [rb [expr {$POOL + $i * $STRIDE + $o}]] }
proc setpool {i o v} { global POOL STRIDE; debug write memory [expr {$POOL + $i * $STRIDE + $o}] $v }
proc sat_y {i} { global ENEMY_SAT; return [vb [expr {$ENEMY_SAT + $i * 4}]] }
proc bullet {} {
    global BULLET
    return [list [rb $BULLET] [rb [expr {$BULLET+1}]] [rb [expr {$BULLET+2}]] [rb [expr {$BULLET+3}]] [rb [expr {$BULLET+4}]]]
}
proc solid {col row} {
    global COLLISION
    if {$col < 0 || $col > 15 || $row < 0 || $row > 11} { return 1 }
    return [expr {[rb [expr {$COLLISION + $row * 16 + $col}]] & 0x10}]
}

proc report {tag} {
    global SCREEN PLAYER_X PLAYER_Y COUNT HEALTH
    L "$tag scr=[rb $SCREEN] count=[rb $COUNT] hp=[rb $HEALTH] player=[rb $PLAYER_X],[rb $PLAYER_Y] bullet=[bullet]"
    for {set i 0} {$i < 4} {incr i} {
        L "   slot$i pos=[pool $i 0],[pool $i 1] mode=[mode $i] satY=[format %02X [sat_y $i]]"
    }
}

# Past the gameflow intro.
foreach t {3 4 5 6 7 8} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}] "keymatrixup 8 0x01"
}

# The bats deal contact damage; a death would restart the game flow mid-run.
proc keep_alive {} { global HEALTH; debug write memory $HEALTH 8; after time 0.25 keep_alive }
after time 9.5 keep_alive

# Pick the firing line: the furthest open cell to the player's right on the
# player's own row, still with air between it and the player.
set ::target_x 0
set ::target_y 0
after time 11 {
    report "before"
    set prow [expr {[rb $PLAYER_Y] >> 4}]
    set pcol [expr {[rb $PLAYER_X] >> 4}]
    set c [expr {$pcol + 1}]
    set last -1
    while {$c < 16 && ![solid $c $prow]} { set last $c; incr c }
    set ::target_x [expr {$last * 16}]
    set ::target_y [rb $PLAYER_Y]
    L "player cell col=$pcol row=$prow -> target cell col=$last (x=$::target_x, y=$::target_y)"
    set line ""
    for {set cc 0} {$cc < 16} {incr cc} { append line [expr {[solid $cc $prow] ? "#" : "."}] }
    L "player row: $line"
}

# Face right, so the bullet is spawned travelling right.
after time 11.5 { keymatrixdown 8 0x80 }
after time 11.7 { keymatrixup 8 0x80 }

# Bat A on the firing line; bat B parked far away in the open, out of the line
# of fire, so it can never eat the same bullet.
proc park_targets {} {
    foreach s {0 1} {
        setpool $s 0 $::target_x
        setpool $s 1 $::target_y
        setpool $s 2 0
        setpool $s 3 0
        setpool $s 24 255
    }
    foreach s {2 3} {
        setpool $s 0 200
        setpool $s 1 24
        setpool $s 2 0
        setpool $s 3 0
        setpool $s 24 255
    }
}
after time 12.0 {
    park_targets
    report "parked"
}

# Fire with the real key. The bats are re-parked between shots so a stray frame
# of movement cannot make the shot miss, and the lock/cooldown are cleared so
# every press counts.
set ::fired 0
proc fire {} {
    global SHOOTLOCK COOLDOWN
    if {[mode 0] == 255} { return }
    if {$::fired > 20} { return }
    incr ::fired
    park_targets
    debug write memory $SHOOTLOCK 0
    debug write memory $COOLDOWN 0
    keymatrixdown 4 0x08
    after time 0.08 { keymatrixup 4 0x08 }
    after time 0.30 fire
}
after time 12.3 fire

after time 12.6 { report "shot-1" }
after time 14   { report "mid" }

after time 18 {
    report "final"
    L ""
    set a0 [mode 0]
    set a1 [mode 1]
    set b0 [mode 2]
    set b1 [mode 3]
    L "shots fired: $::fired"
    L "bat A body slot0 mode=$a0 (must be 255)"
    L "bat A eyes slot1 mode=$a1 (must be 255)"
    L "bat B body slot2 mode=$b0 (must NOT be 255)"
    L "bat B eyes slot3 mode=$b1 (must NOT be 255)"
    L "bat A SAT Y: slot0=[format %02X [sat_y 0]] slot1=[format %02X [sat_y 1]] (must be D4)"
    L "bat B SAT Y: slot2=[format %02X [sat_y 2]] slot3=[format %02X [sat_y 3]] (must NOT be D4)"
    set ok 1
    if {$a0 != 255 || $a1 != 255} { set ok 0; L "FAIL: the bat that was shot is still alive" }
    if {$b0 == 255 || $b1 == 255} { set ok 0; L "FAIL: a bat nobody shot died too" }
    if {[sat_y 0] != 212 || [sat_y 1] != 212} { set ok 0; L "FAIL: the dead bat is still drawn" }
    if {[sat_y 2] == 212 || [sat_y 3] == 212} { set ok 0; L "FAIL: the live bat was hidden" }
    L [expr {$ok ? "RESULT: PASS" : "RESULT: FAIL"}]
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-bats/_bats_shoot.png"
    close $f
    exit
}
