# test606 AIM probe + screenshots — ZCode 2026-09-13
#
# Jordi's real project: pan18 boss fires an authored spread-1 (burst 4, speed 4)
# centred on the player AIM. Route: entry jumps, hold RIGHT with SPACE hops,
# UP closes the intro dialogue, then the fight starts. The probe then walks the
# player LEFT/RIGHT across the boss and:
#   - asserts the invariant sign(bullet v) == sign(playerBodyCentre - bossCentre)
#   - takes a screenshot roughly once a second so Jordi can eyeball the bullets
#
# Key masks (from the generated ASM, row 8): #01 SPACE, #10 LEFT, #20 UP, #80 RIGHT.

set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/test606_aim_shots.txt"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/test606_shots"
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
set BOSS_ACT [symval boss_active]

set AIM_OFF_X 7
set AIM_OFF_Y 17
set captures 0
set fails 0
array set wasact {}

proc watch {} {
    global captures fails POOL SLOTS STRIDE PLR_X PLR_Y BOSS_X BOSS_Y AIM_OFF_X AIM_OFF_Y ROOM TTBUF BOSS_ACT wasact
    # only sample once the boss room is live AND the boss is armed
    if {[mem8 $ROOM] == 12 && [mem8 $BOSS_ACT] == 1 && [mem8 [expr {$TTBUF + 13}]] > 0} {
        set bw [mem8 [expr {$TTBUF + 13}]]
        set bh [mem8 [expr {$TTBUF + 14}]]
        for {set i 0} {$i < $SLOTS} {incr i} {
            set base [expr {$POOL + $i * $STRIDE}]
            set act [mem8 $base]
            # the invariant only holds AT SPAWN: capture the 0->active edge
            if {![info exists wasact($i)]} { set wasact($i) 0 }
            if {!$act} { set wasact($i) 0; continue }
            if {$wasact($i)} { continue }
            set wasact($i) 1
            set x [mem8 [expr {$base+1}]]
            set y [mem8 [expr {$base+2}]]
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
            logline "bullet\[$i\] pos=($x,$y) v=($bdx,$bdy) player=($px,$py) boss=($bx,$by) rel=($relx,$rely) want=$wantx/$wanty got=$gotx/$goty -> $ok"
        }
    }
    after frame watch
}

# Entry jumps, then hold RIGHT with SPACE hops into the boss room.
foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 12 { keymatrixdown 8 0x80 }
foreach t {13 15 17 19 21 23 25 27} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.4}] "keymatrixup 8 0x01"
}
after time 29 { keymatrixup 8 0x80 }
# UP closes the boss intro dialogue and starts the fight (Jordi).
foreach t {24 26 28 30} {
    after time $t     "keymatrixdown 8 0x20"
    after time [expr {$t + 0.3}] "keymatrixup 8 0x20"
}
after time 13 { watch }

# Fight phase: walk LEFT/RIGHT across the boss, screenshot once a second.
set shot 0
proc shotscope {} {
    global shot shot_dir
    if {$shot % 2 == 0} {
        keymatrixdown 8 0x10
        keymatrixup 8 0x80
    } else {
        keymatrixdown 8 0x80
        keymatrixup 8 0x10
    }
    incr shot
    screenshot [format "%s/shot_%02d.png" $shot_dir $shot]
    after time 1 shotscope
}
after time 31 { shotscope }

after time 45 {
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
