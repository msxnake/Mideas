set log "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_p9.txt"
set f [open $log "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc M {a} { return [debug read memory $a] }
proc W {a v} { debug write memory $a $v }
proc dump {tag} {
    set line ""
    for {set i 0xD0A8} {$i <= 0xD0C0} {incr i} { append line [format "%02X " [M $i]] }
    L "$tag  D0A8..D0C0: $line"
}
set phase boot
set n 0
set cnt 0
proc mash {} {
    global n phase
    if {$phase ne "boot"} return
    incr n
    if {$n % 2 == 0} { keymatrixdown 8 0x01 } else { keymatrixup 8 0x01 }
    after time 0.2 mash
}
after time 3 mash
after time 11 {
    global phase cnt
    keymatrixup 8 0x01
    W 0xD0DA 0
    W 0xD0DF 0
    W 0xD0AB 1
    L "setup scr=[M 0xC00B] bact=[M 0xD08E] def1=[M 0xD0AB]"
    dump "after-set"
    set phase gowest
    set cnt 0
}
proc tick {} {
    global phase cnt
    set scr [M 0xC00B]
    switch $phase {
        gowest {
            incr cnt
            if {$cnt < 4} { W 0xC001 6; W 0xC000 60; W 0xC006 0 }
            W 0xC000 60
            W 0xC006 0
            keymatrixdown 8 0x10
            if {$scr == 0} { keymatrixup 8 0x10; L "reached room 0 def1=[M 0xD0AB]"; dump "room0"; set phase pause; set cnt 0 }
            if {$cnt > 300} { L "STUCK going west px=[M 0xC001]"; close $f; exit }
        }
        pause { incr cnt; if {$cnt > 60} { set phase goeast; set cnt 0 } }
        goeast {
            incr cnt
            if {$cnt < 4} { W 0xC001 232; W 0xC000 60; W 0xC006 0 }
            W 0xC000 60
            W 0xC006 0
            keymatrixdown 8 0x80
            if {$scr == 1} { keymatrixup 8 0x80; L "back in room 1 def1=[M 0xD0AB] bact=[M 0xD08E] ist=[M 0xD0DA]"; dump "back1"; set phase settle; set cnt 0 }
            if {$cnt > 300} { L "STUCK going east px=[M 0xC001] scr=$scr"; close $f; exit }
        }
        settle {
            incr cnt
            if {$cnt > 40} {
                L "settled def1=[M 0xD0AB] bact=[M 0xD08E] bhp=[M 0xD095] ist=[M 0xD0DA] iau=[M 0xD0DF]"
                dump "settled"
                L DONE; close $f; exit
            }
        }
    }
    after frame tick
}
tick
