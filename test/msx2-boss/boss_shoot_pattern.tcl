# Shoot patterns from path nodes: the spread must put more than one bullet in
# the pool at once, with different velocities; the linear one always goes down.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_shoot_pattern.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
proc s8 {addr} { set v [mem8 $addr]; if {$v > 127} { return [expr {$v - 256}] }; return $v }
set maxlive 0
set seen {}
proc watch {} {
    global maxlive seen
    set live 0
    set desc ""
    foreach base {0xC1AE 0xC1B7} {
        if {[mem8 $base]} {
            incr live
            set d "[s8 [expr {$base + 3}]],[s8 [expr {$base + 4}]]"
            append desc " ($d)"
            if {[lsearch $seen $d] < 0} { lappend seen $d }
        }
    }
    if {$live > $maxlive} { set maxlive $live }
    after frame watch
}
foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 13 { watch }
after time 22 {
    logline "max bullets alive at once = $maxlive"
    logline "distinct velocities seen  = $seen"
    after time 1 { exit }
}
