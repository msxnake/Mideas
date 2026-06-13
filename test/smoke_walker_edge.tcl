proc rd {addr} { return [debug read memory $addr] }
set ::log {}
proc note {msg} { lappend ::log $msg }
proc flush_log {} {
    set fh [open "test/smoke_walker_edge.txt" w]
    foreach l $::log { puts $fh $l }
    close $fh
}
# slot 0 = walker enemy. runtime_x #C5F0, runtime_dx #C608, runtime_mode #C620.
# Inject a floor at tile row 6 (y=96, just under the enemy feet at y=80+16),
# solid cols 8..12, empty cols 7 and 13 -> two ledges. The walker must pace
# inside the platform and flip dx at each ledge (never leaving it).
after time 6 {
    set base [expr {[rd 0xC004] + 256*[rd 0xC005]}]
    # clear row 5 (body height) so existing map walls don't interfere
    for {set col 6} {$col <= 14} {incr col} {
        debug write memory [expr {$base + 5*16 + $col}] 0
    }
    # row 6 floor: solid cols 8..12, empty cols 7 and 13 -> two ledges
    for {set col 6} {$col <= 14} {incr col} {
        debug write memory [expr {$base + 6*16 + $col}] 0
    }
    for {set col 8} {$col <= 12} {incr col} {
        debug write memory [expr {$base + 6*16 + $col}] 1
    }
    # park the walker mid-platform (col 10 = x160) so it starts on solid ground
    debug write memory 0xC5F0 160
    note "setup base=[format %04X $base] mode0=[rd 0xC620] x0=[rd 0xC5F0] y0=[rd 0xC5FC] dx0=[rd 0xC608]"
    set ::minx 255
    set ::maxx 0
    set ::flips 0
    set ::lastdx [rd 0xC608]
    proc sample {} {
        set x [rd 0xC5F0]
        set dx [rd 0xC608]
        if {$x < $::minx} { set ::minx $x }
        if {$x > $::maxx} { set ::maxx $x }
        if {$dx != $::lastdx} { incr ::flips; set ::lastdx $dx }
    }
    # sample ~every frame for 4 seconds
    for {set i 1} {$i <= 240} {incr i} {
        after time [expr {$i * 0.0166}] { sample }
    }
    after time 4.2 {
        note "result minx=$::minx maxx=$::maxx span=[expr {$::maxx - $::minx}] dirflips=$::flips x_end=[rd 0xC5F0] dx_end=[rd 0xC608]"
        flush_log
        exit
    }
}
