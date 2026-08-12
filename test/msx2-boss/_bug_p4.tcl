set log "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_p4.txt"
set f [open $log "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc M {a} { return [debug read memory $a] }
set phase boot
set cnt 0
set n 0
set upm 0
set tmx 0
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
    debug set_bp 0x4914 {} { incr ::upm }
    debug set_bp 0x4B99 {} { incr ::tmx }
    L "start logging"
}
proc tick {} {
    global phase cnt upm tmx
    if {$phase eq "log"} {
        L [format "f%03d px=%d comp=%d mov=%d fac=%d vy=%d flg=%d ist=%d iau=%d upm=%d tmx=%d" \
            $cnt [M 0xC001] [M 0xC0D1] [M 0xC00A] [M 0xC008] [M 0xC006] [M 0xC007] [M 0xD0DA] [M 0xD0DF] $upm $tmx]
        incr cnt
        if {$cnt >= 40} { L DONE; close $f; exit }
    }
    after frame tick
}
tick
