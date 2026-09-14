# test607 FREEZE + SPRAY probe — ZCode 2026-09-13
#
# Jordi's test607 asset: aimed, spray 1, freezeWhileFiring, burst 4x10, speed 4.
# Record must be #14,#01,#08,#04,#00,#00,#04,#0A.
#
# Claims verified against the live game (room 12, pan18):
#   FREEZE: while boss_burst_idx != 0 the boss must not move (boss_x/boss_y
#           constant from burst start to burst end).
#   SPRAY:  successive waves of a burst lean to opposite sides — boss_shoot_dir
#           (post-spray) takes both aim-1 and aim+1 across the burst, and every
#           captured bullet's velocity must equal the dir16 entry of the dir
#           byte read at capture.

set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/test607_freeze_spray_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

proc symval {label} {
    set sym_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/fixture_test607_unified.sym"
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

set POOL   [symval boss_sbul_pool]
set STRIDE [symval BOSS_SBUL_SLOT]
set TABLE  [symval bitmap_boss_shoot_table]
set DIRTBL [expr {$TABLE + 8}]          ; dir16 table follows the records
set DIR    [symval boss_shoot_dir]
set BURST  [symval boss_burst_idx]
set BOSS_X [symval boss_x]
set BOSS_Y [symval boss_y]
set ROOM   [symval current_screen_index]
set TTBUF  [symval bitmap_boss_table_buf]
set BOSS_ACT [symval boss_active]
set PHSH   [symval boss_phase_shoot]

set spawns 0
set wasact 0
set ok 1
set inburst 0
set bx0 -1
set by0 -1
set burstmoved 0
set bursts 0
set dirs {}
set upcnt 0

proc watch {} {
    global spawns wasact ok POOL STRIDE DIR DIRTBL BURST BOSS_X BOSS_Y ROOM TTBUF BOSS_ACT PHSH inburst bx0 by0 burstmoved bursts dirs upcnt
    # dialogue not closed yet: hold UP ~12 frames every ~40
    if {[mem8 $ROOM] == 12 && [mem8 $BOSS_ACT] == 1 && [mem8 $PHSH] == 255} {
        incr upcnt
        set p [expr {$upcnt % 40}]
        if {$p == 1} { keymatrixdown 8 0x20 }
        if {$p == 14} { keymatrixup 8 0x20 }
    }
    if {[mem8 $ROOM] != 12 || [mem8 $BOSS_ACT] == 0 || [mem8 $PHSH] == 255} {
        after frame watch
        return
    }
    # ---- freeze watch: while a burst is in flight the boss may not move ----
    set bi [mem8 $BURST]
    if {$bi != 0 && !$inburst} {
        set inburst 1
        set bx0 [mem8 $BOSS_X]
        set by0 [mem8 $BOSS_Y]
        set burstmoved 0
    }
    if {$bi != 0 && $inburst} {
        if {[mem8 $BOSS_X] != $bx0 || [mem8 $BOSS_Y] != $by0} { set burstmoved 1 }
    }
    if {$bi == 0 && $inburst} {
        set inburst 0
        incr bursts
        if {$burstmoved} { set ok 0 }
        logline "burst $bursts: boss stayed at ($bx0,$by0) -> [expr {$burstmoved ? \"FAIL moved\" : \"PASS frozen\"}]"
    }
    # ---- spawn watch on pool slot 0 ----
    set act [mem8 $POOL]
    if {!$act} { set wasact 0; after frame watch; return }
    if {$wasact} { after frame watch; return }
    set wasact 1
    set d [mem8 $DIR]
    set v "dx=[mem8 [expr {$POOL+3}]] dxf=[mem8 [expr {$POOL+7}]] dy=[mem8 [expr {$POOL+4}]] dyf=[mem8 [expr {$POOL+8}]]"
    # the velocity must equal the dir16 word pair of the dir byte at capture
    set tw [expr {$DIRTBL + $d * 4}]
    set edx [mem8 [expr {$tw+1}]]
    set edxf [mem8 $tw]
    set edy [mem8 [expr {$tw+3}]]
    set edyf [mem8 [expr {$tw+2}]]
    set match "PASS"
    if {[mem8 [expr {$POOL+3}]] != $edx || [mem8 [expr {$POOL+4}]] != $edy
        || [mem8 [expr {$POOL+7}]] != $edxf || [mem8 [expr {$POOL+8}]] != $edyf} {
        set match "FAIL"
        set ok 0
    }
    lappend dirs $d
    incr spawns
    logline "spawn $spawns: dir=$d v=($v) expected dx=$edx dxf=$edxf dy=$edy dyf=$edyf -> $match"
    after frame watch
}

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
after time 13 { watch }
after time 44 {
    global spawns ok bursts dirs TABLE f
    logline "record: pattern=[mem8 $TABLE] dir=[mem8 [expr {$TABLE+2}]] speed=[mem8 [expr {$TABLE+3}]] stride=[mem8 [expr {$TABLE+5}]] burst=[mem8 [expr {$TABLE+6}]] interval=[mem8 [expr {$TABLE+7}]]"
    logline "spawns=$spawns bursts=$bursts dirs_seen=[lsort -unique -integer $dirs]"
    if {[mem8 $TABLE] != 0x14} { set ok 0; logline "pattern byte is not #14" }
    if {$bursts < 2} { set ok 0; logline "expected at least 2 completed bursts" }
    if {[llength [lsort -unique -integer $dirs]] < 2} { set ok 0; logline "spray did not lean to both sides" }
    if {$ok} { logline "RESULT: PASS" } else { logline "RESULT: FAIL" }
    close $f
    after time 1 { exit }
}
