# test606 AIM probe — ZCode 2026-09-13
#
# Jordi's real project: pan18 boss fires an authored spread-1 (burst 4, speed 4)
# centred on the player AIM. This probe rides the burst and asserts the new
# invariant: the bullet bearing must follow the player BODY CENTRE
# (player_x+7, player_y+17; hitbox body x=3 y=3 w=9 h=29), not the render
# origin. For every captured bullet:
#
#   sign(bullet dx) == sign(playerCentreX - bossCentreX), 0 stays 0
#   sign(bullet dy) == sign(playerCentreY - bossCentreY), 0 stays 0
#
# The old aim compared player_x (render origin) against the boss centre, so a
# player standing straight below the boss centre read as "left" and the bullet
# went down-left: the exact "dispara directamente al jugador y falla" symptom.
#
# Route: start room 11 -> walk RIGHT (row8 #80) into room 12 (pan18), hopping
# over obstacles with SPACE (row8 #01): walk, jump, walk, jump, walk (Jordi).


set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/test606_aim_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

proc symval {label} {
    set sym_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fixture_test606_unified.sym"
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
    error "symbol $label not found"
}

proc mem8 {addr} { return [debug read memory $addr] }
proc s8 {v} { if {$v > 127} { return [expr {$v - 256}] }; return $v }

set POOL   [symval boss_sbul_pool]
set SLOTS  4
# stride comes from the build itself: 9 bytes + 2 when the bullet is animated
set STRIDE [symval BOSS_SBUL_SLOT]
set BOSS_X [symval boss_x]
set BOSS_Y [symval boss_y]
set PLR_X  [symval player_x]
set PLR_Y  [symval player_y]
set ROOM   [symval current_screen_index]
# staged room record: +13 width, +14 height
set TTBUF  [symval bitmap_boss_table_buf]

set AIM_OFF_X 7
set AIM_OFF_Y 17
set captures 0
set fails 0
array set lastx {}

set BOSS_ACT [symval boss_active]

proc watch {} {
    global captures fails POOL SLOTS STRIDE PLR_X PLR_Y BOSS_X BOSS_Y AIM_OFF_X AIM_OFF_Y ROOM TTBUF lastx BOSS_ACT
    # only sample once the boss room is live AND the boss is armed
    if {[mem8 $ROOM] == 12 && [mem8 $BOSS_ACT] == 1 && [mem8 [expr {$TTBUF + 13}]] > 0} {
        set bw [mem8 [expr {$TTBUF + 13}]]
        set bh [mem8 [expr {$TTBUF + 14}]]
        for {set i 0} {$i < $SLOTS} {incr i} {
            set base [expr {$POOL + $i * $STRIDE}]
            if {![mem8 $base]} { continue }
            set x [mem8 [expr {$base+1}]]
            set y [mem8 [expr {$base+2}]]
            # one log line per bullet position, not per frame
            set key [expr {$i * 256 + $x}]
            if {[info exists lastx($i)] && $lastx($i) == $key} { continue }
            set lastx($i) $key
            set bdx [s8 [mem8 [expr {$base+3}]]]
            set bdy [s8 [mem8 [expr {$base+4}]]]
            set px [mem8 $PLR_X]
            set py [mem8 $PLR_Y]
            set bx [mem8 $BOSS_X]
            set by [mem8 $BOSS_Y]
            set relx [expr {($px + $AIM_OFF_X) - ($bx + $bw / 2)}]
            set rely [expr {($py + $AIM_OFF_Y) - ($by + $bh / 2)}]
            set wantx 0
            if {$relx > 0} { set wantx 1 } elseif {$relx < 0} { set wantx -1 }
            set wanty 0
            if {$rely > 0} { set wanty 1 } elseif {$rely < 0} { set wanty -1 }
            set gotx 0
            if {$bdx > 0} { set gotx 1 } elseif {$bdx < 0} { set gotx -1 }
            set goty 0
            if {$bdy > 0} { set goty 1 } elseif {$bdy < 0} { set goty -1 }
            incr captures
            set ok "PASS"
            if {$gotx != $wantx || $goty != $wanty} { set ok "FAIL"; incr fails }
            logline "bullet\[$i\] pos=($x,$y) v=($bdx,$bdy) player=($px,$py) boss=($bx,$by) size=($bw,$bh) rel=($relx,$rely) want=$wantx/$wanty got=$gotx/$goty -> $ok"
        }
    }
    after frame watch
}

# Entry jumps first, then hold RIGHT and pulse SPACE: walk, jump, walk, jump.
foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 12 {
    keymatrixdown 8 0x80
}
foreach t {13 15 17 19 21 23 25 27} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.4}] "keymatrixup 8 0x01"
}
after time 29 {
    keymatrixup 8 0x80
}
# UP closes the boss intro dialogue and starts the fight (Jordi).
foreach t {24 26 28 30} {
    after time $t     "keymatrixdown 8 0x20"
    after time [expr {$t + 0.3}] "keymatrixup 8 0x20"
}
after time 13 { watch }
after time 42 {
    global captures fails f
    logline "captures=$captures fails=$fails"
    if {$captures > 0 && $fails == 0} {
        logline "RESULT: PASS"
    } else {
        logline "RESULT: FAIL"
    }
    close $f
    after time 1 { exit }
}
