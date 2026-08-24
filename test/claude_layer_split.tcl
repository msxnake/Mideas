# Do the two colour layers of ONE placed enemy stay together?
#
# A 16x16 enemy with two colour layers becomes TWO pool slots at the same
# coordinates — that is how layered sprites are drawn. It is only correct while
# the two slots move IDENTICALLY. The scripted interpreter runs once per slot,
# and each slot owns its own state, timer and velocity, so nothing in the design
# forces them to agree. RANDOM makes it worse: the seed advances on every call,
# so the two layers read DIFFERENT numbers and can take different decisions.
#
# This prints both slots side by side and flags the first tick where they differ.
#
#   pool #D0D4, stride 30: x+0, y+1, dx+2, state+25, timer+26

set OUT "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual/layer_split.txt"
set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set POOL   0xD0D4
set STRIDE 30
set n 0
set firstDiff -1

proc rb {a} { return [debug read memory $a] }
proc slot {i off} { return [rb [expr {$::POOL + $i * $::STRIDE + $off}]] }

proc tick {} {
    incr ::n
    set x0 [slot 0 0]; set y0 [slot 0 1]; set s0 [slot 0 25]; set t0 [slot 0 26]
    set x1 [slot 1 0]; set y1 [slot 1 1]; set s1 [slot 1 25]; set t1 [slot 1 26]
    set diff ""
    if {$x0 != $x1 || $y0 != $y1} { set diff "  <-- SEPARADOS ${x0}x${y0} vs ${x1}x${y1}" }
    if {$::firstDiff < 0 && ($x0 != $x1 || $y0 != $y1)} { set ::firstDiff $::n }
    say [format "%2ds | capa0 x=%3d y=%3d st=%d t=%3d | capa1 x=%3d y=%3d st=%d t=%3d%s" \
        $::n $x0 $y0 $s0 $t0 $x1 $y1 $s1 $t1 $diff]
    if {$::n >= 40} {
        say ""
        say "result=COMPLETE firstDivergence=$::firstDiff  (-1 = nunca)"
        close $::LOG
        exit
    }
    after time 1.0 tick
}

after time 4.0 tick
after time 70.0 { say "result=TIMEOUT"; close $::LOG; exit }
