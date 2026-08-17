# Sample the bat SAT and VDP status selection around gameplay frames.
# This is a diagnostic sidecar; it does not alter ROM state.

set out_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/t501/_codex_sat_vblank_probe.txt"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/t501"
set log [open $out_path "w"]

proc rb {addr} { debug read memory $addr }
proc vb {addr} { debug read VRAM $addr }
proc L {msg} { global log; puts $log $msg; flush $log }

set ::POOL 0xD056
set ::STRIDE 25
set ::SAT 0xF610
set ::samples 0
set ::pair_mismatches 0
set ::hud_entries 0
set ::r15_nonzero 0

proc sat_entry {slot} {
    set base [expr {$::SAT + $slot * 4}]
    return [list [vb $base] [vb [expr {$base + 1}]] [vb [expr {$base + 2}]] [vb [expr {$base + 3}]]]
}

proc pool_xy {slot} {
    set base [expr {$::POOL + $slot * $::STRIDE}]
    return [list [rb $base] [rb [expr {$base + 1}]]]
}

proc sample_sat {} {
    incr ::samples
    set r15 [debug read "VDP regs" 15]
    if {$r15 != 0} { incr ::r15_nonzero }
    set s0 [sat_entry 0]
    set s1 [sat_entry 1]
    set s2 [sat_entry 2]
    set s3 [sat_entry 3]
    if {[lrange $s0 0 1] ne [lrange $s1 0 1] || [lrange $s2 0 1] ne [lrange $s3 0 1]} {
        incr ::pair_mismatches
        L "PAIR sample=$::samples r15=$r15 sat0=$s0 sat1=$s1 sat2=$s2 sat3=$s3 pool0=[pool_xy 0] pool1=[pool_xy 1] pool2=[pool_xy 2] pool3=[pool_xy 3]"
    }
    foreach entry [list $s0 $s1 $s2 $s3] {
        set y [lindex $entry 0]
        if {$y < 20} { incr ::hud_entries }
    }
    if {$::samples < 700} { after time 0.005 sample_sat }
}

foreach t {3 4 5 6 7 8} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}] "keymatrixup 8 0x01"
}

after time 9.0 sample_sat
after time 9.5 { screenshot "$::shot_dir/_codex_sat_probe_095.png" }
after time 10.0 { screenshot "$::shot_dir/_codex_sat_probe_100.png" }
after time 11.0 { screenshot "$::shot_dir/_codex_sat_probe_110.png" }
after time 13.0 {
    L "SUMMARY samples=$::samples pair_mismatches=$::pair_mismatches hud_entries=$::hud_entries r15_nonzero=$::r15_nonzero"
    L "FINAL sat0=[sat_entry 0] sat1=[sat_entry 1] sat2=[sat_entry 2] sat3=[sat_entry 3]"
    close $log
    exit
}
