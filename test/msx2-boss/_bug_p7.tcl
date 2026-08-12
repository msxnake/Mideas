set log "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_p7.txt"
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
    debug write memory 0xD0DA 0
    debug write memory 0xD0DF 0
    L "intro cleared; px=[M 0xC001] py=[M 0xC000]"
}
proc tick {} {
    global phase cnt
    if {$phase eq "log"} {
        if {$cnt == 5}  { keymatrixdown 8 0x01 }
        if {$cnt == 12} { keymatrixup 8 0x01 }
        if {$cnt == 60} { keymatrixdown 8 0x10 }
        L [format "f%03d px=%d py=%d vy=%d flg=%d" $cnt [M 0xC001] [M 0xC000] [M 0xC006] [M 0xC007]]
        incr cnt
        if {$cnt >= 90} { L DONE; close $f; exit }
    }
    after frame tick
}
tick
