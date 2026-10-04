set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/_thread_control.txt" "w"]
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
after time 3 mash
proc tick {} {
    global phase cnt
    if {$phase eq "boot"} {
        if {[M 0xD175] == 1} {
            keymatrixup 8 0x01
            set phase run
            L "boss armed: scr=[M 0xC00B]"
        }
    }
    if {$phase eq "run"} {
        incr cnt
        if {$cnt == 60}  { L "T60: intro=[M 0xD1CF] iauto=[M 0xD1D4] px=[M 0xC001] py=[M 0xC000] itick=[M 0xD17F] bossY=[M 0xD177]" }
        if {$cnt == 300} { L "T300: intro=[M 0xD1CF] iauto=[M 0xD1D4] px=[M 0xC001] py=[M 0xC000] itick=[M 0xD17F] bossY=[M 0xD177]" }
        if {$cnt == 600} { L "T600: intro=[M 0xD1CF] iauto=[M 0xD1D4] px=[M 0xC001] py=[M 0xC000] itick=[M 0xD17F] bossY=[M 0xD177]"; L DONE; close $f; exit }
    }
    after frame tick
}
set cnt 0
tick
