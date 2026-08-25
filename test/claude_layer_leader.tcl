# Does the FIRST layer decide for the whole body now?
#
# Three questions, three counters, because a screenshot answers none of them:
#   1. Do the two hardware layers of one enemy still hold together? (position)
#   2. Does the second layer take the follower path instead of thinking?
#   3. Is the behaviour interpreter running ONCE per body per frame, not twice?
#
# Question 3 is the whole point of the refactor, and it is the one that cannot
# be seen on screen: two layers stepping in perfect agreement look exactly like
# one layer being copied.
#
# Addresses from server/temp/behaviour_visual/bouncer.sym of THIS build:
#   bitmap_enemy_script_step 0x614C
#   .enemy_step_follow       0x5E4E
#   bitmap_enemy_pool        0xD0D4  stride 30: x+0, y+1, dx+2, mode+13
#   bitmap_enemy_count       0xD0D3

set OUT "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual/layer_leader.txt"
set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set POOL   0xD0D4
set STRIDE 30
set steps 0
set follows 0
set n 0
set firstDiff -1

debug set_bp 0x614C {} { incr ::steps }
debug set_bp 0x5E4E {} { incr ::follows }

proc rb {a} { return [debug read memory $a] }
proc slot {i off} { return [rb [expr {$::POOL + $i * $::STRIDE + $off}]] }

proc tick {} {
    incr ::n
    set x0 [slot 0 0]; set y0 [slot 0 1]; set m0 [slot 0 13]
    set x1 [slot 1 0]; set y1 [slot 1 1]; set m1 [slot 1 13]
    set diff ""
    if {$x0 != $x1 || $y0 != $y1} {
        set diff "  <-- SEPARADOS"
        if {$::firstDiff < 0} { set ::firstDiff $::n }
    }
    say [format "%2ds | capa0 x=%3d y=%3d mode=%3d | capa1 x=%3d y=%3d mode=%3d | scriptSteps=%5d follows=%5d%s" \
        $::n $x0 $y0 $m0 $x1 $y1 $m1 $::steps $::follows $diff]
    if {$::n >= 20} {
        say ""
        say "count=[rb 0xD0D3]"
        say "result=COMPLETE firstDivergence=$::firstDiff  (-1 = nunca)"
        say "scriptStepsTotal=$::steps followsTotal=$::follows"
        close $::LOG
        exit
    }
    after time 1.0 tick
}

after time 4.0 tick
after time 60.0 { say "result=TIMEOUT"; close $::LOG; exit }
