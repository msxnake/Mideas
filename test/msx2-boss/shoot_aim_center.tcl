# AIM-CENTRE probe: the aimed pattern must fire along the boss->player BODY
# CENTRE bearing, not the player render origin. This probe asserts the
# invariant directly from live RAM, so it works on the unaligned and the
# aligned build alike:
#
#   sign(bullet dx) == sign(playerCentreX - bossCentreX), 0 stays 0
#   sign(bullet dy) == sign(playerCentreY - bossCentreY), 0 stays 0
#
# With the player body centre EXACTLY below the boss centre (rebuild with
# --boss-x tuned for that), the bullet must read dx=0 dxf=0 dy=2 dyf=0.
# The old aim compared player_x (render origin) against the boss centre and
# answered down-left in exactly that aligned setup.

set script_dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss"
set log_path "$script_dir/shoot_aim_center.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

proc symval {label} {
    global script_dir
    set sym_path "$script_dir/shoot_aimed.sym"
    set fh [open $sym_path r]
    set data [read $fh]
    close $fh
    foreach line [split $data "\n"] {
        if {[string match "$label: equ *" $line]} {
            if {[regexp {equ\s+([0-9A-Fa-f]+)H} $line -> hex]} {
                return [expr {"0x$hex"}]
            }
        }
    }
    error "symbol $label not found in $sym_path"
}

proc mem8 {addr} { return [debug read memory $addr] }
proc s8 {v} { if {$v > 127} { return [expr {$v - 256}] }; return $v }

set POOL    [symval boss_sbul_pool]
set BOSS_X  [symval boss_x]
set BOSS_Y  [symval boss_y]
set PLR_X   [symval player_x]
set PLR_Y   [symval player_y]

# player hitbox body x=3 y=3 w=9 h=29 (fixture), boss body 64x64
set AIM_OFF_X 7
set AIM_OFF_Y 17
set BOSS_HALF 32

set captured 0
set cap ""
set px 0
set py 0
set bx 0
set by 0

proc watch {} {
    global captured cap px py bx by POOL PLR_X PLR_Y BOSS_X BOSS_Y
    if {!$captured && [mem8 $POOL]} {
        set captured 1
        set cap "dx=[mem8 [expr {$POOL+3}]] dxf=[mem8 [expr {$POOL+7}]] dy=[mem8 [expr {$POOL+4}]] dyf=[mem8 [expr {$POOL+8}]]"
        set px [mem8 $PLR_X]
        set py [mem8 $PLR_Y]
        set bx [mem8 $BOSS_X]
        set by [mem8 $BOSS_Y]
    }
    after frame watch
}

# Three jumps past the room entry, same as the other probes.
foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 13 { watch }
after time 24 {
    global captured cap px py bx by f AIM_OFF_X AIM_OFF_Y BOSS_HALF
    if {!$captured} {
        logline "RESULT: FAIL - no bullet captured"
        close $f
        after time 1 { exit }
    }
    logline "player   : x=$px y=$py (centre [expr {$px + $AIM_OFF_X}],[expr {$py + $AIM_OFF_Y}])"
    logline "boss     : x=$bx y=$by (centre [expr {$bx + $BOSS_HALF}],[expr {$by + $BOSS_HALF}])"
    logline "velocity : $cap"
    set bdx [s8 [mem8 [expr {$POOL+3}]]]
    set bdy [s8 [mem8 [expr {$POOL+4}]]]
    set relx [expr {($px + $AIM_OFF_X) - ($bx + $BOSS_HALF)}]
    set rely [expr {($py + $AIM_OFF_Y) - ($by + $BOSS_HALF)}]
    set wantx 0
    if {$relx > 0} { set wantx 1 } elseif {$relx < 0} { set wantx -1 }
    set wanty 0
    if {$rely > 0} { set wanty 1 } elseif {$rely < 0} { set wanty -1 }
    set gotx 0
    if {$bdx > 0} { set gotx 1 } elseif {$bdx < 0} { set gotx -1 }
    set goty 0
    if {$bdy > 0} { set goty 1 } elseif {$bdy < 0} { set goty -1 }
    logline "relative : dxCentre=$relx dyCentre=$rely -> want dxsign=$wantx dysign=$wanty, got $gotx/$goty"
    if {$gotx == $wantx && $goty == $wanty} {
        logline "RESULT: PASS"
    } else {
        logline "RESULT: FAIL - aimed bullet does not follow the body-centre bearing"
    }
    close $f
    after time 1 { exit }
}
