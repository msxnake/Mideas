# Does an enemy fall when nothing is under it, WITHOUT a rule saying so?
#
# The walker preset has no vertical action anywhere in it: three states, all
# horizontal. Before automatic gravity it would hang in the air for ever. So
# lift it off the ground at runtime and watch what the engine does on its own.
#
# Poking the pool instead of authoring a floating enemy is deliberate: it tests
# the engine, not the room, and the room stays the one Jordi built.
#
# It SWEEPS the lift height rather than picking one, because "it did not fall"
# has two very different explanations — gravity is broken, or the spot chosen
# happens to be inside a platform — and one height cannot tell them apart.
#
# Addresses from server/temp/behaviour_visual/walker.sym of THIS build:
#   bitmap_enemy_pool             #D0D4  stride 30: x+0, y+1, vy+27
#   bitmap_enemy_count            #D0D3

set OUT "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual/enemy_gravity.txt"
set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set POOL   0xD0D4
set STRIDE 30
set ground -1
set LIFTS {8 16 24 32 40 48}
set idx 0

proc rb {a} { return [debug read memory $a] }
proc slot {i off} { return [rb [expr {$::POOL + $i * $::STRIDE + $off}]] }

proc start {} {
    if {[rb 0xD0D3] == 0 || [slot 0 1] > 200} { after time 0.5 start; return }
    set ::ground [slot 0 1]
    # PIN THE COLUMN FIRST. The walker walks, so a height sweep that lets it
    # move is really sweeping height AND x at once: the first run of this probe
    # reported "stayed in the air" for one height and it turned out the enemy had
    # simply walked over a platform by then. Collapsing the patrol bounds onto
    # the current x freezes it without touching the behaviour.
    set x [slot 0 0]
    debug write memory [expr {$::POOL + 4}] $x
    debug write memory [expr {$::POOL + 5}] $x
    say "suelo y=$::ground, columna fijada en x=$x"
    say ""
    say " levanto | y tras 1.2s | veredicto"
    after time 0.2 next
}

proc next {} {
    if {$::idx >= [llength $::LIFTS]} {
        say ""
        say "result=COMPLETE ground=$::ground"
        close $::LOG
        exit
    }
    set lift [lindex $::LIFTS $::idx]
    debug write memory [expr {$::POOL + 1}] [expr {$::ground - $lift}]
    debug write memory [expr {$::POOL + 27}] 0
    after time 1.2 [list measure $lift]
}

proc measure {lift} {
    set y [slot 0 1]
    set verdict "SE QUEDO EN EL AIRE"
    if {$y == $::ground} {
        set verdict "cayo al suelo"
    } elseif {$y > [expr {$::ground - $lift}]} {
        set verdict "cayendo (y=$y)"
    }
    say [format "%8d | %11d | %s" $lift $y $verdict]
    incr ::idx
    after time 0.2 next
}

after time 5.0 start
after time 60.0 { say "result=TIMEOUT"; close $::LOG; exit }
