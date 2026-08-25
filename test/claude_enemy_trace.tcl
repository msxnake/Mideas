# Plain x/y/vy trace of the scripted enemy, sampled fast enough to see an arc.
# MIDEAS_CASE names the output so several presets can be traced in one session.
#
#   pool #D0D4, stride 30: x+0, y+1, state+25, vy+27

set CASE [lindex $::env(MIDEAS_CASE) 0]
set OUT "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual/${CASE}_trace.txt"
set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set POOL   0xD0D4
set STRIDE 30
set n 0
set minY 255
set maxY 0

proc rb {a} { return [debug read memory $a] }
proc slot {i off} { return [rb [expr {$::POOL + $i * $::STRIDE + $off}]] }

proc tick {} {
    incr ::n
    set y [slot 0 1]
    if {$y < 200} {
        if {$y < $::minY} { set ::minY $y }
        if {$y > $::maxY} { set ::maxY $y }
    }
    set vy [slot 0 27]
    if {$vy > 127} { set vy [expr {$vy - 256}] }
    say [format "%3d | x=%3d y=%3d vy=%3d st=%d | capa1 x=%3d y=%3d" \
        $::n [slot 0 0] $y $vy [slot 0 25] [slot 1 0] [slot 1 1]]
    if {$::n >= 60} {
        say ""
        say "result=COMPLETE minY=$::minY maxY=$::maxY recorridoVertical=[expr {$::maxY - $::minY}]"
        close $::LOG
        exit
    }
    after time 0.2 tick
}

after time 5.0 tick
after time 45.0 { say "result=TIMEOUT"; close $::LOG; exit }
