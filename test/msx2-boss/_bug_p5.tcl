set log "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_p5.txt"
set f [open $log "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc M {a} { return [debug read memory $a] }
set phase boot
set cnt 0
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
    set phase log
    L "before override: px=[M 0xC001] py=[M 0xC000] ist=[M 0xD0DA] iau=[M 0xD0DF]"
    debug write memory 0xD0DA 0
    debug write memory 0xD0DF 0
    keymatrixdown 8 0x10
    L "manual LEFT held, intro cleared"
}
proc tick {} {
    global phase cnt
    if {$phase eq "log"} {
        L [format "f%03d px=%d py=%d mov=%d fac=%d ist=%d iau=%d" \
            $cnt [M 0xC001] [M 0xC000] [M 0xC00A] [M 0xC008] [M 0xD0DA] [M 0xD0DF]]
        incr cnt
        if {$cnt >= 40} { screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_p5.png"; L DONE; close $f; exit }
    }
    after frame tick
}
tick
