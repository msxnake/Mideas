# Tick-by-tick, from two heights one pixel apart, because the 1.2s sweep said
# they behave differently and the collision grid says they are the same cell.
# One of those two things is wrong and only the intermediate frames can say
# which.
#
#   pool #D0D4, stride 30: x+0, y+1, minX+4, maxX+5, vy+27
#   collision map #C010, index = (Y & #F0) + (X >> 4)

set OUT "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual/gravity_step.txt"
set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }
proc rb {a} { return [debug read memory $a] }

set POOL 0xD0D4
set HEIGHTS {88 87}
set idx 0
set n 0

proc start {} {
    if {[rb 0xD0D3] == 0 || [rb [expr {$::POOL + 1}]] > 200} { after time 0.5 start; return }
    set x [rb $::POOL]
    debug write memory [expr {$::POOL + 4}] $x
    debug write memory [expr {$::POOL + 5}] $x
    say "columna fijada x=$x (col [expr {$x >> 4}])"
    after time 0.3 next
}

proc next {} {
    if {$::idx >= [llength $::HEIGHTS]} { say ""; say "result=COMPLETE"; close $::LOG; exit }
    set y [lindex $::HEIGHTS $::idx]
    debug write memory [expr {$::POOL + 1}] $y
    debug write memory [expr {$::POOL + 27}] 0
    set feet [expr {$y + 16}]
    set cell [rb [expr {0xC010 + ($feet & 0xF0) + ([rb $::POOL] >> 4)}]]
    say ""
    say [format "--- puesto en y=%d (pies en %d, celda %02X) ---" $y $feet $cell]
    set ::n 0
    after time 0.1 sample
}

proc sample {} {
    incr ::n
    set y [rb [expr {$::POOL + 1}]]
    set vy [rb [expr {$::POOL + 27}]]
    if {$vy > 127} { set vy [expr {$vy - 256}] }
    say [format "  %2d | y=%3d vy=%3d" $::n $y $vy]
    if {$::n >= 14} { incr ::idx; after time 0.2 next; return }
    after time 0.1 sample
}

after time 5.0 start
after time 40.0 { say "result=TIMEOUT"; close $::LOG; exit }
