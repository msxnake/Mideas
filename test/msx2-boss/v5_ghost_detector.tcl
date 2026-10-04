# Ghost detector v3: armed ONLY once the boss fight starts (boss_active=1/2),
# so boot-time uninitialized SAT noise cannot flood the capture budget.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/v5_ghost_detector.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
set throttle on
set POOL 0xD21C
set SAT  0xF440
set STRIDE 11
set frame 0
set ghosts 0
set armed 0
set lastSum -1
proc scan {} {
    global POOL SAT STRIDE frame ghosts armed lastSum
    incr frame
    set act [mem8 0xD173]
    if {!$armed} {
        if {$act == 1 || $act == 2} {
            set armed 1
            logline [format "ARMED frame=%d boss=%d,%d" $frame [mem8 0xD174] [mem8 0xD175]]
        }
        after frame scan
        return
    }
    if {$act == 0} {
        logline [format "UNARMED frame=%d (boss left / died)" $frame]
        set armed 0
        after frame scan
        return
    }
    set live 0
    set bad 0
    for {set i 0} {$i < 2} {incr i} {
        set a [mem8 [expr {$POOL + $i*$STRIDE}]]
        set y [vpeek [expr {$SAT + $i*4}]]
        if {$a != 0} { incr live } else { if {$y < 0xD0} { incr bad
            set badslot $i; set bady $y
            set badx [vpeek [expr {$SAT + $i*4 + 1}]]
            set badp [vpeek [expr {$SAT + $i*4 + 2}]] } }
    }
    if {$bad > 0 && $ghosts < 40} {
        incr ghosts
        screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/ghost_frame_$frame.png"
        logline [format "GHOST #%d frame=%d slot=%d Y=%d X=%d pat=%d live=%d boss=%d,%d" \
            $ghosts $frame $badslot $bady $badx $badp $live [mem8 0xD174] [mem8 0xD175]]
    }
    set sum [expr {$live * 10 + $bad}]
    if {$sum != $lastSum} {
        logline [format "frame=%d live=%d bad=%d boss=%d,%d" $frame $live $bad [mem8 0xD174] [mem8 0xD175]]
        set lastSum $sum
    }
    if {($frame % 600) == 0} {
        logline [format "FIGHTMARK frame=%d live=%d bad=%d ghosts=%d boss=%d,%d" $frame $live $bad $ghosts [mem8 0xD174] [mem8 0xD175]]
    }
    after frame scan
}
after frame scan
after time 1800 { logline "TIMEOUT ghosts=$::ghosts"; close $::f; exit }
logline "v5_ghost_detector v3 (armed on boss_active)"
