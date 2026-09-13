# Frame-by-frame trace around the first spiral fire (test606 spiral build).
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/test606_spiral_trace.txt"
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
set DIR    [symval boss_shoot_dir]
set SPD    [symval boss_shoot_spd]
set CNT    [symval boss_shoot_cnt]
set OFF    [symval boss_shoot_off]
set STEP   [symval boss_shoot_step]
set ROT    [symval boss_shoot_rot]
set ROOM   [symval current_screen_index]
set TTBUF  [symval bitmap_boss_table_buf]
set BOSS_ACT [symval boss_active]
set PHSH   [symval boss_phase_shoot]

proc watch {} {
    global POOL DIR SPD CNT OFF STEP ROT ROOM TTBUF BOSS_ACT PHSH
    if {[mem8 $ROOM] == 12 && [mem8 $BOSS_ACT] == 1} {
        set s0 [mem8 $POOL]
        set line "spd=[mem8 $SPD] dir=[mem8 $DIR] rot=[mem8 $ROT] cnt=[mem8 $CNT] off=[mem8 $OFF] step=[mem8 $STEP] ph_shoot=[mem8 $PHSH] s0=$s0"
        if {$s0} {
            append line " x=[mem8 [expr {$POOL+1}]] y=[mem8 [expr {$POOL+2}]] dx=[mem8 [expr {$POOL+3}]] dy=[mem8 [expr {$POOL+4}]] dxf=[mem8 [expr {$POOL+7}]] dyf=[mem8 [expr {$POOL+8}]]"
        }
        logline $line
    }
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
foreach t {24 26 28 30} {
    after time $t     "keymatrixdown 8 0x20"
    after time [expr {$t + 0.3}] "keymatrixup 8 0x20"
}
after time 13 { watch }
after time 40 {
    close $f
    after time 1 { exit }
}
