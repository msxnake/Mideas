set log "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_p8.txt"
set f [open $log "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc M {a} { return [debug read memory $a] }
proc dump {tag} {
    set line ""
    for {set i 0xD0A8} {$i <= 0xD0C0} {incr i} { append line [format "%02X " [M $i]] }
    L "$tag D0A8: $line"
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
    global phase
    keymatrixup 8 0x01
    debug write memory 0xD0DA 0
    debug write memory 0xD0DF 0
    debug write memory 0xD0AB 1   ;# boss_defeated[1] = killed
    L "setup: scr=[M 0xC00B] px=[M 0xC001] py=[M 0xC000] bact=[M 0xD08E]"
    dump "after-set"
    set phase jump
    set cnt 0
}
proc tick {} {
    global phase cnt
    set scr [M 0xC00B]
    switch $phase {
        jump {
            incr cnt
            if {$cnt == 5} { keymatrixdown 8 0x01 }
            if {$cnt == 12} { keymatrixup 8 0x01 }
            if {$cnt > 60} { L "after jump py=[M 0xC000]"; set phase east }
        }
        east {
            keymatrixdown 8 0x80
            if {$scr == 2} { keymatrixup 8 0x80; L "in room 2 def1=[M 0xD0AB] bact=[M 0xD08E]"; dump "room2"; set phase pause; set cnt 0 }
        }
        pause { incr cnt; if {$cnt > 40} { set phase west; set cnt 0 } }
        west {
            keymatrixdown 8 0x10
            if {$scr == 1} { keymatrixup 8 0x10; L "back in room 1 def1=[M 0xD0AB] bact=[M 0xD08E] ist=[M 0xD0DA]"; dump "back1"; set phase settle; set cnt 0 }
        }
        settle {
            incr cnt
            if {$cnt > 60} {
                L "settled def1=[M 0xD0AB] bact=[M 0xD08E] ist=[M 0xD0DA] iau=[M 0xD0DF] bhp=[M 0xD095]"
                dump "settled"
                screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_bug_p8.png"
                L DONE; close $f; exit
            }
        }
    }
    after frame tick
}
tick
