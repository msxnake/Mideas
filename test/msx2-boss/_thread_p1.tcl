set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_thread_p1.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }

# Spider thread probe v3: also logs the Room Lock intro state, the cadence and
# the render phase, to see WHY the boss is not descending.
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
after time 3 mash

proc snapshot {tag} {
    global f
    set tphase [M 0xD1D6]
    set len    [M 0xD1D7]
    set bossy  [M 0xD177]
    set act    [M 0xD175]
    set intro  [M 0xD1CF]
    set iauto  [M 0xD1D4]
    set itick  [M 0xD17F]
    set rphase [M 0xD191]
    set px     [M 0xC001]
    set py     [M 0xC000]
    set vy     [M 0xC006]
    set tgt    [M 0xD1D5]
    set hp     [M 0xC1FD]
    set dlg    [M 0xD0E8]
    L "$tag: active=$act intro=$intro iauto=$iauto itick=$itick rphase=$rphase tphase=$tphase len=$len bossY=$bossy px=$px py=$py vy=$vy tgt=$tgt hp=$hp dlg=$dlg"
}

proc tick {} {
    global phase cnt
    if {$phase eq "boot"} {
        if {[M 0xD175] == 1 && [M 0xD1DA] == 96} {
            keymatrixup 8 0x01
            set phase run
            L "thread armed: scr=[M 0xC00B] intro=[M 0xD1CF] px=[M 0xC001]"
        }
    }
    if {$phase eq "run"} {
        incr cnt
        if {$cnt == 30}  { snapshot "T30" }
        if {$cnt == 120} { snapshot "T120"; screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_thread_p1_120.png" }
        if {$cnt == 300} { snapshot "T300" }
        if {$cnt == 600} {
            snapshot "T600"
            L "intro final: [M 0xD1CF]"
            L DONE
            close $f
            exit
        }
    }
    after frame tick
}
set cnt 0
tick
