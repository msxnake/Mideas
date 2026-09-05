# The demo: an enemy whose behaviour has NO vertical action anywhere in it,
# lifted into the air, falling on its own.
#
# The lift is a debug poke on purpose. Authoring a floating enemy would prove
# the room, not the engine; poking the pool leaves Jordi's room exactly as he
# built it and asks the engine the one question that matters.
#
# Frames every 0.06s, because the fall takes about a third of a second and a
# once-a-second sample would show a body here and then a body there.
#
#   pool #D0D4, stride 30: x+0, y+1, minX+4, maxX+5, vy+27

set OUTDIR "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual"
set LOG [open "$OUTDIR/gravity_demo.txt" w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set POOL   0xD0D4
set STRIDE 30
set n 0
set recording 0
set ground -1

proc rb {a} { return [debug read memory $a] }
proc slot {i off} { return [rb [expr {$::POOL + $i * $::STRIDE + $off}]] }

proc start {} {
    if {[rb 0xD0D3] == 0 || [slot 0 1] > 200} { after time 0.5 start; return }
    set ::ground [slot 0 1]
    # Freeze the column so the fall is vertical and the frames are comparable:
    # a walker that keeps walking turns a fall into a diagonal and invites the
    # question "did it fall or did it walk down a step?".
    set x [slot 0 0]
    debug write memory [expr {$::POOL + 4}] $x
    debug write memory [expr {$::POOL + 5}] $x
    if {![catch { record start "$::OUTDIR/gravity_demo.avi" }]} { set ::recording 1 }
    say "suelo y=$::ground, columna x=$x, recording=$::recording"
    say ""
    say "  f |   y  vy | nota"
    after time 0.5 shoot_before
}

proc shoot_before {} {
    incr ::n
    screenshot -raw [format "%s/grav_%02d.png" $::OUTDIR $::n]
    say [format "%3d | %3d %3d | en el suelo" $::n [slot 0 1] [slot 0 27]]
    if {$::n < 3} { after time 0.15 shoot_before; return }
    # Up near the room lid, so the drop is long enough to read on screen AND
    # ends on the half-height ledge below rather than back where it started:
    # landing somewhere NEW is what makes the frames unambiguous.
    debug write memory [expr {$::POOL + 1}] 16
    debug write memory [expr {$::POOL + 27}] 0
    say "--- levantado a y=16, sin tocar nada mas ---"
    after time 0.02 shoot_fall
}

proc shoot_fall {} {
    incr ::n
    screenshot -raw [format "%s/grav_%02d.png" $::OUTDIR $::n]
    set y [slot 0 1]
    set vy [slot 0 27]
    if {$vy > 127} { set vy [expr {$vy - 256}] }
    set nota "cayendo"
    if {$vy == 0 && $::n > 5} { set nota "posado" }
    say [format "%3d | %3d %3d | %s" $::n $y $vy $nota]
    if {$::n >= 20} {
        if {$::recording} { catch { record stop } }
        say ""
        say "result=COMPLETE ground=$::ground final=[slot 0 1]"
        close $::LOG
        exit
    }
    after time 0.06 shoot_fall
}

after time 5.0 start
after time 45.0 { catch { record stop }; say "result=TIMEOUT"; close $::LOG; exit }
