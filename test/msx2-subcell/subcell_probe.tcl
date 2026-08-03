# 8x8 sub-cell solidity runtime check (SCREEN 5 bitmap room).
#
# Fixture layout (see scripts/build_msx2_subcell_shape_smoke.mjs):
#   row  5 (y 80..95)   solid, shape 3  -> only y 80..87 blocks (half ceiling)
#   row  8 (y 128..143) solid, shape 12 -> only y 136..143 blocks (half ledge)
#   row 11 (y 176..191) solid, no shape -> the whole cell blocks
#
# Player body is 16px tall (hbTop 0, hbBottom 15), spawn (48, 96).
# Expected with 8x8 sub-cells:
#   rest_y = 120  (feet at 135, i.e. ON the half ledge; a full cell would give 112)
#   min_y  =  88  (head at 88, INSIDE the lower half of the ceiling cell; a full
#                  cell would stop the jump at 96)
# RAM: player_y #C000, player_x #C001, collision map #C010, behavior map #C200.
proc rd {a} { return [debug read memory $a] }

set ::log {}
set ::miny 255
set ::minhp 255
set ::frames 260

proc note {m} { lappend ::log $m }

proc finish {} {
    note "min_y $::miny"
    note "min_health $::minhp"
    note "final_x [rd 0xC001] final_y [rd 0xC000]"
    note "coll_r8c3 [format %02X [rd 0xC093]]"
    note "beh_r8c3 [format %02X [rd 0xC283]]"
    note "coll_r5c3 [format %02X [rd 0xC063]]"
    note "beh_r5c3 [format %02X [rd 0xC253]]"
    note "coll_r11c3 [format %02X [rd 0xC0C3]]"
    note "coll_r10c12_deadly [format %02X [rd 0xC0BC]] beh [format %02X [rd 0xC2AC]]"
    note "health [rd 0xC1FD] lives [rd 0xC1FE]"
    set fh [open $::env(OUT) w]
    foreach l $::log { puts $fh $l }
    close $fh
    exit
}

proc sample {n} {
    set y [rd 0xC000]
    if {$y < $::miny} { set ::miny $y }
    set hp [rd 0xC1FD]
    if {$hp < $::minhp} { set ::minhp $hp }
    if {$n > 0} {
        after frame [list sample [expr {$n - 1}]]
    } else {
        finish
    }
}

after time 8 {
    note "rest_y [rd 0xC000]"
    note "rest_x [rd 0xC001]"
    note "health0 [rd 0xC1FD]"
    keymatrixdown 8 0x01
    after time 0.15 { keymatrixup 8 0x01 }
    after time 0.6 { keymatrixdown 8 0x80 }
    after time 3.0 { keymatrixup 8 0x80 }
    sample $::frames
}
