# FIXED-ANGLE RING probe: a radial of 2 authored with fixedAngle: true, angle 6
# must centre the wave on slot 6 (bullets on slots 6 and 14) NO MATTER where the
# player stands. Pattern byte must be #83 (radial | bit 7).
#
#   slot  6: (sin 135,  -cos 135)  = ( 0.7071,  0.7071) *2 -> dx #016A, dy #016A
#   slot 14: (sin 337.5, -cos 337.5) = (-0.3827, -0.9239) *2 -> dx #FF3C, dy #FE26
#
# Pool slots 0/1: (1, 1 + 106/106) then (-2, -2 + 150/38? no: dy #FE26 = -2 +38/256,
# dx #FF3C = -1 + 60/256) — asserted byte by byte below.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/shoot_fanfixed.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

proc symval {label} {
    set sym_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/shoot_fanfixed.sym"
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
set SLOT   9
set TABLE  [symval bitmap_boss_shoot_table]

set b0 0
set b1 0
set v0 ""
set v1 ""

proc watch {} {
    global b0 b1 v0 v1 POOL SLOT
    if {!$b0 && [mem8 $POOL]} {
        set b0 1
        set v0 "dx=[mem8 [expr {$POOL+3}]] dxf=[mem8 [expr {$POOL+7}]] dy=[mem8 [expr {$POOL+4}]] dyf=[mem8 [expr {$POOL+8}]]"
    }
    if {!$b1 && [mem8 [expr {$POOL+$SLOT}]]} {
        set b1 1
        set v1 "dx=[mem8 [expr {$POOL+$SLOT+3}]] dxf=[mem8 [expr {$POOL+$SLOT+7}]] dy=[mem8 [expr {$POOL+$SLOT+4}]] dyf=[mem8 [expr {$POOL+$SLOT+8}]]"
    }
    after frame watch
}

foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 13 { watch }
after time 24 {
    global b0 b1 v0 v1 TABLE
    logline "record   : pattern=[mem8 $TABLE] count=[mem8 [expr {$TABLE+1}]] dir=[mem8 [expr {$TABLE+2}]] speed=[mem8 [expr {$TABLE+3}]]"
    logline "bullet 0 : $v0"
    logline "bullet 1 : $v1"
    set ok 1
    if {[mem8 $TABLE] != 0x83} { set ok 0; logline "pattern byte is not #83 (radial|fixedAngle)" }
    if {!$b0 || !$b1} { set ok 0 }
    if {$b0} {
        if {[mem8 [expr {$POOL+3}]] != 1 || [mem8 [expr {$POOL+7}]] != 0x6A
            || [mem8 [expr {$POOL+4}]] != 1 || [mem8 [expr {$POOL+8}]] != 0x6A} {
            set ok 0; logline "bullet 0 is not slot 6 (1 + 106/256 per axis)"
        }
    }
    if {$b1} {
        if {[mem8 [expr {$POOL+$SLOT+3}]] != 0xFF || [mem8 [expr {$POOL+$SLOT+7}]] != 0x3C
            || [mem8 [expr {$POOL+$SLOT+4}]] != 0xFE || [mem8 [expr {$POOL+$SLOT+8}]] != 0x26} {
            set ok 0; logline "bullet 1 is not slot 14 (#FF3C / #FE26)"
        }
    }
    if {$ok} { logline "RESULT: PASS" } else { logline "RESULT: FAIL" }
    close $f
    after time 1 { exit }
}
