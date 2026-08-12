set log "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_p6.txt"
set f [open $log "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc M {a} { return [debug read memory $a] }
set phase boot
set n 0
proc mash {} {
    global n phase
    if {$phase ne "boot"} return
    incr n
    if {$n % 2 == 0} { keymatrixdown 8 0x01 } else { keymatrixup 8 0x01 }
    after time 0.2 mash
}
after time 3 mash
after time 11 {
    global phase
    keymatrixup 8 0x01
    set phase done
    L "px=[M 0xC001] py=[M 0xC000] scr=[M 0xC00B]"
    for {set r 0} {$r < 12} {incr r} {
        set line ""
        for {set c 0} {$c < 16} {incr c} {
            append line [format "%02X " [M [expr {0xC010 + $r*16 + $c}]]]
        }
        L [format "row%02d %s" $r $line]
    }
    close $f
    exit
}
