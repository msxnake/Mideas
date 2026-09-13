# AUTHORED ANGLE probe: a linear shot authored at angle 15 (337.5 degrees, 22.5
# left of up) must leave along ring slot 15, an ODD slot the old compass
# dropdown could never reach.
#
#   unit = (sin 337.5deg, -cos 337.5deg) = (-0.3827, -0.9239)
#   table words: dx = round(-0.3827*256) = -98 (#FF9E), dy = -237 (#FF17)
#   speed 2 doubles them: dx = -196 = #FF3C, dy = -474 = #FE26
#
# So pool slot 0 must read dx=#FF(-1) dxf=#3C(60) dy=#FE(-2) dyf=#26(38), and
# the record's dir byte must be #0F.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/shoot_angle22.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

proc symval {label} {
    set sym_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/shoot_angle22.sym"
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

set POOL  [symval boss_sbul_pool]
set TABLE [symval bitmap_boss_shoot_table]

set captured 0
set cap ""
set rec ""

proc watch {} {
    global captured cap POOL
    if {!$captured && [mem8 $POOL]} {
        set captured 1
        set cap "dx=[mem8 [expr {$POOL+3}]] dxf=[mem8 [expr {$POOL+7}]] dy=[mem8 [expr {$POOL+4}]] dyf=[mem8 [expr {$POOL+8}]]"
    }
    after frame watch
}

foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 13 { watch }
after time 24 {
    global captured cap rec POOL TABLE
    logline "record   : pattern=[mem8 $TABLE] count=[mem8 [expr {$TABLE+1}]] dir=[mem8 [expr {$TABLE+2}]] speed=[mem8 [expr {$TABLE+3}]]"
    if {!$captured} {
        logline "RESULT: FAIL - no bullet captured"
    } else {
        logline "velocity : $cap"
        set ok 1
        if {[mem8 [expr {$TABLE+2}]] != 15}                       { set ok 0 }
        if {[mem8 [expr {$POOL+3}]]  != 0xFF}                     { set ok 0 }
        if {[mem8 [expr {$POOL+7}]]  != 0x3C}                     { set ok 0 }
        if {[mem8 [expr {$POOL+4}]]  != 0xFE}                     { set ok 0 }
        if {[mem8 [expr {$POOL+8}]]  != 0x26}                     { set ok 0 }
        if {$ok} { logline "RESULT: PASS" } else { logline "RESULT: FAIL - wrong vector for ring slot 15" }
    }
    close $f
    after time 1 { exit }
}
