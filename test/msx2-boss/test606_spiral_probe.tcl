# test606 SPIRAL probe — ZCode 2026-09-13
#
# Jordi's real project with phase 1 repointed at a spiral shoot asset
# (spread-1, fixedAngle 0 = up, spin: true, speed 4, burst 3 every 10 frames).
#
# Claims verified against the live game (room 12, pan18 boss):
#   - the record bakes as #C2,#01,#00,#04,#00,#01,#03,#0A
#   - each burst wave rotates the base angle ONE ring step (22.5 degrees):
#       wave 0 -> slot 0: dx=0    dxf=0         dy=252  dyf=0
#       wave 1 -> slot 1: dx=1    dxf=136       dy=252  dyf=76
#       wave 2 -> slot 2: dx=2    dxf=212       dy=253  dyf=44
#     (pool slot 0 carries the first bullet of every wave; the burst repeats
#     every 90 frames, so the triple is asserted modulo 3 per spawn edge)
#
# Route (Jordi): entry jumps, hold RIGHT with SPACE hops, UP closes the intro
# dialogue, fight starts.

set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/test606_spiral_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

proc symval {label} {
    set sym_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test606_z38_spiral_unified.sym"
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
set ROT    [symval boss_shoot_rot]
set ROOM   [symval current_screen_index]
set TTBUF  [symval bitmap_boss_table_buf]
set BOSS_ACT [symval boss_active]

# expected per rot-after value: wave used rot-1; velocity must be that slot.
#   used rot 0 -> slot 0: dx=0    dxf=0         dy=252 dyf=0
#   used rot 1 -> slot 1: dx=1    dxf=136       dy=252 dyf=76
#   used rot 2 -> slot 2: dx=2    dxf=212       dy=253 dyf=44
set e1 {0 0 252 0}
set e2 {1 136 252 76}
set e3 {2 212 253 44}

set waves 0
set wasact 0
set ok 1

set BOSS_ACT2 [symval boss_active]
set PLX [symval player_x]
set PLY [symval player_y]
set DLGST [symval bitmap_dlg_state]
set INTRO [symval boss_intro_state]
set PHSH [symval boss_phase_shoot]
proc ping {} {
    global ROOM PLX PLY BOSS_ACT2 DLGST INTRO PHSH
    logline "route: room=[mem8 $ROOM] player=([mem8 $PLX],[mem8 $PLY]) boss_act=[mem8 $BOSS_ACT2] dlg=[mem8 $DLGST] intro=[mem8 $INTRO] ph=[mem8 $PHSH]"
    after time 1 ping
}
ping
set upcnt 0
proc watch {} {
    global waves wasact POOL STRIDE ok e1 e2 e3 ROT ROOM TTBUF BOSS_ACT TABLE PHSH upcnt
    # fight not started yet? pulse UP every ~20 frames until the phase resolves
    if {[mem8 $ROOM] == 12 && [mem8 $BOSS_ACT] == 1 && [mem8 $PHSH] == 255} {
        incr upcnt
        set p [expr {$upcnt % 20}]
        if {$p == 1} { keymatrixdown 8 0x20 }
        if {$p == 8} { keymatrixup 8 0x20 }
    }
    if {[mem8 $ROOM] != 12 || [mem8 $BOSS_ACT] == 0 || [mem8 $PHSH] == 255} {
        after frame watch
        return
    }
    set act [mem8 $POOL]
    if {!$act} { set wasact 0; after frame watch; return }
    if {$wasact} { after frame watch; return }
    set wasact 1
    set r [mem8 $ROT]
    set got "dx=[mem8 [expr {$POOL+3}]] dxf=[mem8 [expr {$POOL+7}]] dy=[mem8 [expr {$POOL+4}]] dyf=[mem8 [expr {$POOL+8}]]"
    set okline 1
    if {$r < 1 || $r > 3} { set okline 0 } else {
        set e [set e$r]
        if {[mem8 [expr {$POOL+3}]] != [lindex $e 0] || [mem8 [expr {$POOL+7}]] != [lindex $e 1]
            || [mem8 [expr {$POOL+4}]] != [lindex $e 2] || [mem8 [expr {$POOL+8}]] != [lindex $e 3]} {
            set okline 0
        }
    }
    if {!$okline} { set ok 0 }
    logline "spawn $waves (rot after=$r): $got -> [expr {$okline ? \"PASS\" : \"FAIL\"}]"
    incr waves
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
# UP pulses to close the intro dialogue are driven from watch (see below).
after time 13 { watch }
after time 48 {
    global waves ok TABLE f
    logline "record: pattern=[mem8 $TABLE] dir=[mem8 [expr {$TABLE+2}]] speed=[mem8 [expr {$TABLE+3}]] stride=[mem8 [expr {$TABLE+5}]] burst=[mem8 [expr {$TABLE+6}]] interval=[mem8 [expr {$TABLE+7}]]"
    logline "waves=$waves"
    if {[mem8 $TABLE] != 0xC2} { set ok 0; logline "pattern byte is not #C2" }
    if {$waves < 3} { set ok 0; logline "expected at least 3 spawn edges" }
    if {$ok} { logline "RESULT: PASS" } else { logline "RESULT: FAIL" }
    close $f
    after time 1 { exit }
}
