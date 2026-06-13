proc rd {addr} { return [debug read memory $addr] }
set ::log {}
proc note {msg} { lappend ::log $msg }
proc flush_log {} {
    set fh [open "test/smoke_enemy_bridge.txt" w]
    foreach l $::log { puts $fh $l }
    close $fh
}
# Library-placed WalkerTurnOnEdge enemy: slot0 mode #C620, x #C5F0, dx #C608.
# Verify (1) it walks on an injected platform, (2) it damages the player on contact.
after time 6 {
    set base [expr {[rd 0xC004] + 256*[rd 0xC005]}]
    # floor row 7 (under enemy at tile y=6 -> feet y=112 -> row 7), solid cols 7..13
    for {set col 6} {$col <= 14} {incr col} { debug write memory [expr {$base + 7*16 + $col}] 0 }
    for {set col 7} {$col <= 13} {incr col} { debug write memory [expr {$base + 7*16 + $col}] 1 }
    debug write memory 0xC5F0 160
    note "setup mode0=[rd 0xC620] x0=[rd 0xC5F0] dx0=[rd 0xC608] lives=[rd 0xC011]"
    set ::minx 255; set ::maxx 0; set ::lastdx [rd 0xC608]; set ::flips 0
    proc sample {} {
        set x [rd 0xC5F0]; set dx [rd 0xC608]
        if {$x < $::minx} {set ::minx $x}; if {$x > $::maxx} {set ::maxx $x}
        if {$dx != $::lastdx} {incr ::flips; set ::lastdx $dx}
    }
    for {set i 1} {$i <= 180} {incr i} { after time [expr {$i*0.0166}] { sample } }
    after time 3.2 {
        note "walk minx=$::minx maxx=$::maxx span=[expr {$::maxx-$::minx}] flips=$::flips"
        # now teleport the player onto the enemy to force contact damage
        set ex [rd 0xC5F0]
        debug write memory 0xC000 $ex
        debug write memory 0xC001 [rd 0xC5FC]
        set ::lives_before [rd 0xC011]
        after time 0.8 {
            note "contact lives_before=$::lives_before lives_after=[rd 0xC011] hit=[rd 0xC016]"
            flush_log
            exit
        }
    }
}
