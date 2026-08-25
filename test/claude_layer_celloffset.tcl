# Does a follower REBUILD its position, or does it just copy the leader's?
#
# On a 16x16 enemy the two answers look identical: every layer's cell offset is
# zero, so "copy" and "rebuild from the body origin" agree by accident. The
# difference only shows on a sprite wider than one cell — which this project has
# no asset for yet.
#
# So force it: poke a cell offset of 16 into the follower's slot at runtime and
# watch where it goes. Rebuilding puts it exactly 16px to the right of the
# leader and KEEPS it there while the leader moves. Copying pins it on top of
# the leader, and a wide sprite would render as one stacked cell.
#
#   pool #D0D4, stride 30: x+0, y+1, xOff+14

set OUT "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual/layer_celloffset.txt"
set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set POOL   0xD0D4
set STRIDE 30
set n 0
set bad 0

proc rb {a} { return [debug read memory $a] }
proc slot {i off} { return [rb [expr {$::POOL + $i * $::STRIDE + $off}]] }

proc poke {} {
    debug write memory [expr {$::POOL + $::STRIDE + 14}] 16
    say "poked xOff=16 into slot 1"
    say ""
    say "  s | capa0 x | capa1 x | delta (esperado 16)"
    after time 1.0 tick
}

proc tick {} {
    incr ::n
    set x0 [slot 0 0]
    set x1 [slot 1 0]
    set d [expr {$x1 - $x0}]
    if {$d != 16} { incr ::bad }
    say [format "%3d | %6d | %6d | %5d%s" $::n $x0 $x1 $d [expr {$d == 16 ? "" : "  <-- MAL"}]]
    if {$::n >= 12} {
        say ""
        say "result=COMPLETE ticksWrongDelta=$::bad"
        close $::LOG
        exit
    }
    after time 1.0 tick
}

after time 6.0 poke
after time 45.0 { say "result=TIMEOUT"; close $::LOG; exit }
