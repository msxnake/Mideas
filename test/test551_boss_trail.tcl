# Does the boss repair the background it walks over?
#
# One screenshot cannot answer this: a body drawn on top of its own trail looks
# identical to a body drawn on clean background. Sample the SAME room at several
# points of the patrol and record boss_x with each frame, so a leftover column
# shows up as pixels where the body no longer is.
set DIR "C:/Users/salam/AppData/Local/Temp/mideas-test551"
set LOG [open "$DIR/test551-trail.log" w]
proc say {msg} { global LOG; puts $LOG $msg; flush $LOG }

set RAM_boss_x     0xD2C4
set RAM_boss_y     0xD2C5
set RAM_boss_oldx  0xD2C6
set RAM_boss_active 0xD2C3

proc snap {tag} {
    global DIR RAM_boss_x RAM_boss_y RAM_boss_active
    set x [debug read memory $RAM_boss_x]
    set y [debug read memory $RAM_boss_y]
    set a [debug read memory $RAM_boss_active]
    say [format "%s active=%d x=%d y=%d  (right edge = %d)" $tag $a $x $y [expr {$x + 128}]]
    screenshot "$DIR/trail-$tag.png"
}

after time 6.000  { snap t06 ; debug cont }
after time 9.000  { snap t09 ; debug cont }
after time 12.000 { snap t12 ; debug cont }
after time 16.000 { snap t16 ; debug cont }
after time 20.000 { snap t20 ; debug cont }
after time 24.000 { snap t24 ; close $LOG ; after time 0.300 { exit } }
debug cont
