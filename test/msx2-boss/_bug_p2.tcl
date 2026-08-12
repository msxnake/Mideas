set log "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_p2.txt"
set f [open $log "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc M {a} { return [debug read memory $a] }
set n 0
proc mash {} {
    global n phase
    if {$phase ne "boot"} return
    incr n
    if {$n % 2 == 0} { keymatrixdown 8 0x01 } else { keymatrixup 8 0x01 }
    after time 0.2 mash
}
set phase boot
set cnt 0
set started 0
after time 3 mash
proc tick {} {
    global phase cnt started
    set bact [M 0xD08E]
    if {$phase eq "boot"} {
        if {$bact != 0} {
            keymatrixup 8 0x01
            set phase log
            L "boss armed"
        }
    }
    if {$phase eq "log"} {
        L [format "f%03d scr=%d px=%d py=%d bact=%d bhp=%d ist=%d iau=%d dlg=%d def0=%d def1=%d bar=%d" \
            $cnt [M 0xC00B] [M 0xC001] [M 0xC000] $bact [M 0xD095] [M 0xD0DA] [M 0xD0DF] [M 0xD040] [M 0xD0AA] [M 0xD0AB] [M 0xD0B8]]
        incr cnt
        if {$cnt >= 200} { screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_p2.png"; L DONE; close $f; exit }
    }
    after frame tick
}
tick
