# Clean boot into the boss room (fixture_boss_def). Dense flat-schedule sampling
# of the auto-walk: does player_x move toward center (121)? Is composition
# blocking it? Is gravity stuck?
set log "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/bossdef_autowalk.txt"
set f [open $log "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc M {a} { return [debug read memory $a] }

set COMP  0xC0D1
set STATE 0xD0DA
set AUTO  0xD0DF
set BACT  0xD08E
set PX    0xC001
set PY    0xC000
set VY    0xC006
set SCR   0xC00B

proc rep {tag} {
    global COMP STATE AUTO BACT PX PY VY SCR
    L [format "%-7s scr=%d bact=%d comp=%d state=%d auto=%d x=%d y=%d vy=%d" $tag \
        [M $SCR] [M $BACT] [M $COMP] [M $STATE] [M $AUTO] [M $PX] [M $PY] [M $VY]]
}

# Sample every 0.25s from t12 to t30 (past the variable boot delay).
for {set t 120} {$t <= 300} {incr t 5} {
    set ts [expr {$t / 10.0}]
    after time $ts "rep t$ts"
}
after time 30.5 { close $f; exit }
