# Diagnostic 2: dump the room collision grid, park the bat in real open air and
# inject a bullet next to it. Bats fly through rock, bullets die on it, so the
# first attempt parked the target inside a wall and the bullet never survived
# long enough to be offered to the enemy check.

set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-bats"
set f [open "$dir/_bats_shoot_diag2.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }

set POOL      0xD056
set STRIDE    26
set COUNT     0xD055
set PLAYER_X  0xC001
set PLAYER_Y  0xC000
set HEALTH    0xC1FD
set BULLET    0xC0DA
set COLLISION 0xC010

proc rb {a} { debug read memory $a }
proc mode {i} { global POOL STRIDE; return [rb [expr {$POOL + $i * $STRIDE + 13}]] }
proc pool {i o} { global POOL STRIDE; return [rb [expr {$POOL + $i * $STRIDE + $o}]] }
proc setpool {i o v} { global POOL STRIDE; debug write memory [expr {$POOL + $i * $STRIDE + $o}] $v }
proc bullet {} {
    global BULLET
    return [list [rb $BULLET] [rb [expr {$BULLET+1}]] [rb [expr {$BULLET+2}]] [rb [expr {$BULLET+3}]] [rb [expr {$BULLET+4}]]]
}
proc solid {col row} {
    global COLLISION
    return [expr {[rb [expr {$COLLISION + $row * 16 + $col}]] & 0x10}]
}

foreach t {3 4 5 6 7 8} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}] "keymatrixup 8 0x01"
}
proc keep_alive {} { global HEALTH; debug write memory $HEALTH 8; after time 0.25 keep_alive }
after time 9.5 keep_alive

set ::hits 0
after time 10.5 {
    debug set_bp 0x81F0 {} {
        incr ::hits
        if {$::hits <= 4} { L "  enter bitmap_enemy_bullet_hit bullet=[bullet] slot0=[pool 0 0],[pool 0 1] mode0=[pool 0 13]" }
    }
}

after time 11 {
    L "player=[rb $PLAYER_X],[rb $PLAYER_Y] count=[rb $COUNT]"
    L "collision grid (# = solid, . = air), 16 cols x 12 rows:"
    for {set r 0} {$r < 12} {incr r} {
        set line ""
        for {set c 0} {$c < 16} {incr c} { append line [expr {[solid $c $r] ? "#" : "."}] }
        L "  row [format %2d $r] $line"
    }
    # A run of 3 air cells: room for the bat and for the bullet's approach.
    set ::air_col -1
    set ::air_row -1
    for {set r 0} {$r < 12 && $::air_row < 0} {incr r} {
        for {set c 1} {$c < 14} {incr c} {
            if {![solid $c $r] && ![solid [expr {$c+1}] $r] && ![solid [expr {$c-1}] $r]} {
                set ::air_col $c; set ::air_row $r; break
            }
        }
    }
    L "open-air cell chosen: col=$::air_col row=$::air_row"
}

after time 11.5 {
    set bx [expr {$::air_col * 16}]
    set by [expr {$::air_row * 16}]
    foreach s {0 1} {
        setpool $s 0 $bx
        setpool $s 1 $by
        setpool $s 2 0
        setpool $s 3 0
        setpool $s 24 255
    }
    debug write memory [expr {$BULLET+1}] [expr {$bx - 4}]
    debug write memory [expr {$BULLET+2}] [expr {$by + 4}]
    debug write memory [expr {$BULLET+3}] 1
    debug write memory [expr {$BULLET+4}] 20
    debug write memory $BULLET 1
    L "bat at $bx,$by  injected bullet=[bullet]"
}
after time 11.55 { L "t+1f  bullet=[bullet] mode0=[mode 0] mode1=[mode 1]" }
after time 12.5  { L "after bullet=[bullet] mode0=[mode 0] mode1=[mode 1] mode2=[mode 2] mode3=[mode 3]" }
after time 13 {
    L "enemy-check entries seen: $::hits"
    close $f
    exit
}
