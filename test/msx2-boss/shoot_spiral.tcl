# SPIRAL probe: a spread-1 authored at fixed angle 0 (up) with spin: true fires
# three burst waves, and the base angle must rotate ONE ring step per wave:
#
#   wave 0 -> slot 0: (0,-1)*2        dx=0  dxf=0   dy=-2 dyf=0
#   wave 1 -> slot 1: (-0.383,-0.924)*2  dx=#FF3C (-1 + 60/256)  dy=#FE26 (-2 + 38/256)
#   wave 2 -> slot 2: (0.707,-0.707)*2   dx=#016A ( 1 + 106/256) dy=#FE96 (-2 + 150/256)
#
# The record must read pattern=#C2 (spread | fixedAngle bit7 | spin bit6),
# dir=#00, stride=#01, burst=#03, interval=#0A.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/shoot_spiral.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

proc symval {label} {
    set sym_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/shoot_spiral.sym"
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

# expected per wave: {dx dxf dy dyf}
set expect(0) {0 0 254 0}
set expect(1) {255 60 254 38}
set expect(2) {1 106 254 150}

set waves 0
set wasact 0
set ok 1

proc watch {} {
    global waves wasact POOL STRIDE ok expect
    set act [mem8 $POOL]
    if {!$act} { set wasact 0; after frame watch; return }
    if {$wasact} { after frame watch; return }
    set wasact 1
    set got "dx=[mem8 [expr {$POOL+3}]] dxf=[mem8 [expr {$POOL+7}]] dy=[mem8 [expr {$POOL+4}]] dyf=[mem8 [expr {$POOL+8}]]"
    set e $expect($waves)
    logline "wave $waves: $got rot=[mem8 $ROT]"
    if {[mem8 [expr {$POOL+3}]] != [lindex $e 0] || [mem8 [expr {$POOL+7}]] != [lindex $e 1]
        || [mem8 [expr {$POOL+4}]] != [lindex $e 2] || [mem8 [expr {$POOL+8}]] != [lindex $e 3]} {
        set ok 0
        logline "  expected dx=[lindex $e 0] dxf=[lindex $e 1] dy=[lindex $e 2] dyf=[lindex $e 3]"
    }
    incr waves
    after frame watch
}

foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 13 { watch }
after time 26 {
    global waves ok TABLE f
    logline "record: pattern=[mem8 $TABLE] count=[mem8 [expr {$TABLE+1}]] dir=[mem8 [expr {$TABLE+2}]] speed=[mem8 [expr {$TABLE+3}]] stride=[mem8 [expr {$TABLE+5}]] burst=[mem8 [expr {$TABLE+6}]] interval=[mem8 [expr {$TABLE+7}]]"
    if {[mem8 $TABLE] != 0xC2} { set ok 0; logline "pattern byte is not #C2" }
    if {$waves != 3} { set ok 0; logline "expected 3 waves, saw $waves" }
    if {$ok} { logline "RESULT: PASS" } else { logline "RESULT: FAIL" }
    close $f
    after time 1 { exit }
}
