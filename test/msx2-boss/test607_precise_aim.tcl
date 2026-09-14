# Reproducible route through the real test607 project. Read addresses from the
# corresponding build. Only player invulnerability is pinned during sampling.
set root "C:/Users/salam/Documents/Programacion/Mideas/work"
set f [open "$root/test607_precise_probe.txt" w]
set sf [open "$root/test607_precise.sym" r]
set syms [read $sf]
close $sf
proc addr {label} {
    if {![regexp -line "^${label}: equ (\[0-9A-Fa-f\]+)H" $::syms -> hex]} { error "Missing symbol $label" }
    return [expr "0x$hex"]
}
proc mem {label} { debug read memory [addr $label] }
proc logline {s} { puts $::f $s; flush $::f }
set throttle off
set n 0
set failures 0
set boots 0
set waves {}
set maxus 0
set maxmiss 0
set upcnt 0
set samples 0
set freezeFails 0
set activeBurst 0
set completed 0
set bx0 0
set by0 0
proc aim_start {} {
    set ::start [machine_info time]
    set ::savedix [reg IX]
    set ::savediy [reg IY]
    debug cont
}
proc vector_ready {} {
    if {[mem current_screen_index] != 12} { debug cont; return }
    set us [expr {([machine_info time]-$::start)*1000000}]
    if {$us > $::maxus} { set ::maxus $us }
    if {[reg IX] != $::savedix || [reg IY] != $::savediy} { incr ::failures; logline "FAIL vector register preservation" }
    debug cont
}
proc spawned {} {
    if {[mem current_screen_index] != 12} { debug cont; return }
    set t [addr bitmap_boss_table_buf]
    set bw [debug read memory [expr {$t+13}]]
    set bh [debug read memory [expr {$t+14}]]
    set dx [expr {[mem player_x]+7-([mem boss_x]+$bw/2)}]
    set dy [expr {[mem player_y]+17-([mem boss_y]+$bh/2)}]
    if {$dx==0 && $dy==0} {set dy 1}
    set vx [expr {([reg D]>=128 ? [reg D]-256 : [reg D])*256+[mem boss_sbul_dxf]}]
    set vy [expr {([reg E]>=128 ? [reg E]-256 : [reg E])*256+[mem boss_sbul_dyf]}]
    set norm [expr {sqrt(double($vx*$vx+$vy*$vy))}]
    set miss [expr {abs(double($vx*$dy-$vy*$dx))/$norm}]
    if {$miss > $::maxmiss} {set ::maxmiss $miss}
    set ok [expr {$miss<1 && abs($norm/256.0-4)/4 < 0.005 && $vx*$dx+$vy*$dy>0}]
    if {!$ok} {incr ::failures}
    incr ::n
    lappend ::waves [mem boss_burst_left]
    logline "SPAWN $::n slot=[reg IY] rel=$dx,$dy velocity=$vx,$vy miss=$miss left=[mem boss_burst_left] ok=$ok"
    debug cont
}
proc frame_watch {} {
    if {[mem current_screen_index]==12 && [mem boss_active]==1} {
        debug write memory [addr player_invuln] 255
        if {[mem boss_phase_shoot]==255} {
            incr ::upcnt
            set phase [expr {$::upcnt % 40}]
            if {$phase==1} {keymatrixdown 8 0x20}
            if {$phase==14} {keymatrixup 8 0x20}
        } else {
            incr ::samples
            set bursting [mem boss_burst_idx]
            if {$bursting && !$::activeBurst} {
                set ::activeBurst 1
                set ::bx0 [mem boss_x]
                set ::by0 [mem boss_y]
            }
            if {$bursting && ([mem boss_x]!=$::bx0 || [mem boss_y]!=$::by0)} {incr ::freezeFails}
            if {!$bursting && $::activeBurst} {set ::activeBurst 0; incr ::completed}
        }
    }
    after frame frame_watch
}
proc guarded {cmd} {
    if {[catch {uplevel #0 $cmd} err]} { logline "FAIL callback: $err"; close $::f; exit }
}
debug set_bp [addr bitmap_boss_aim_vector] {} {guarded aim_start}
debug set_bp [addr bitmap_boss_sbul_spawn_dir] {} {guarded vector_ready}
debug set_bp [addr .bsd_found] {} {guarded spawned}
debug set_bp 0x4010 {} {incr ::boots; debug cont}
foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t+0.5}] "keymatrixup 8 0x01"
}
after time 12 {keymatrixdown 8 0x80}
foreach t {13 15 17 19 21 23 25 27} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t+0.4}] "keymatrixup 8 0x01"
}
after time 29 {keymatrixup 8 0x80}
foreach t {24 26 28 30 32} {
    after time $t "keymatrixdown 8 0x20"
    after time [expr {$t+0.3}] "keymatrixup 8 0x20"
}
after time 13 {frame_watch}
after time 32 {screenshot "$root/test607_precise_32.png"}
after time 33 {keymatrixdown 8 0x10}
after time 34 {keymatrixup 8 0x10}
after time 35 {screenshot "$root/test607_precise_35.png"}
after time 37 {keymatrixdown 8 0x80}
after time 38 {keymatrixup 8 0x80}
after time 40 {screenshot "$root/test607_precise_40.png"}
after time 48 {
    set ok [expr {$::n>=8 && $::failures==0 && $::boots<=1 && $::completed>=2 && $::freezeFails==0}]
    logline "RESULT ok=$ok spawns=$::n failures=$::failures completedBursts=$::completed freezeFailures=$::freezeFails boots=$::boots samples=$::samples maxMissPx=$::maxmiss maxAimUs=$::maxus waves=$::waves"
    close $::f
    exit
}
