# Radial + burst: record #03 #04 #08 #02 #00 #04 #03 #0A
#   pattern 3 (radial), 4 bullets/wave, base ring slot 8, speed 2,
#   start 0, stride 4 (= 4 * 22.5 = 90 degrees), 3 waves, 10 frames apart.
#
# Claims:
#   - the ring walks: velocities 90 degrees apart show up, not one repeated pair
#   - the burst is STAGGERED: boss_burst_idx goes non-zero and counts down over
#     several frames instead of everything leaving on one frame
#   - the burst ends: idx returns to 0 with left = 0
#
# Pool slot 0 = #C1AE, slot 1 = #C1B7 (9 bytes each).
# Burst RAM: idx #C1CE, left #C1CF, cd #C1D0.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/shoot_radial.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
proc s8 {addr} { set v [mem8 $addr]; if {$v > 127} { return [expr {$v - 256}] }; return $v }

set seen {}
set maxlive 0
set burstframes 0
set burstseen {}

proc watch {} {
    global seen maxlive burstframes burstseen
    set live 0
    foreach base {0xC1AE 0xC1B7} {
        if {[mem8 $base]} {
            incr live
            # whole px + fraction, so a 22.5-degree step is distinguishable
            set d "[s8 [expr {$base + 3}]].[mem8 [expr {$base + 7}]],[s8 [expr {$base + 4}]].[mem8 [expr {$base + 8}]]"
            if {[lsearch $seen $d] < 0} { lappend seen $d }
        }
    }
    if {$live > $maxlive} { set maxlive $live }
    set idx [mem8 0xC1CE]
    if {$idx} {
        incr burstframes
        set state "left=[mem8 0xC1CF]"
        if {[lsearch $burstseen $state] < 0} { lappend burstseen $state }
    }
    after frame watch
}

foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 13 { watch }
after time 30 {
    logline "max bullets alive at once = $maxlive"
    logline "distinct velocities (dx.frac,dy.frac) = $seen"
    logline "frames with a burst in flight = $burstframes"
    logline "burst countdown states seen   = $burstseen"
    logline "burst at end: idx=[mem8 0xC1CE] left=[mem8 0xC1CF]"
    after time 1 { exit }
}
