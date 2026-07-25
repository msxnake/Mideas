# Path-driven firing: with firing='path' the cadence is off, so any live bullet
# must come from a #F2 node action.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_path_fire.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
set seen 0
proc watch {tag} {
    global seen
    set a0 [mem8 0xC1AE]
    set a1 [mem8 0xC1B3]
    if {$a0 || $a1} { incr seen }
    logline [format "%s x=%d y=%d mode=%d slot0=%d slot0x=%d slot1=%d liveSamples=%d" \
        $tag [mem8 0xC177] [mem8 0xC178] [mem8 0xC1BE] $a0 [mem8 0xC1AF] $a1 $seen]
}
after time 6  { keymatrixdown 8 0x01 }
after time 7  { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 9  { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 11 { keymatrixup 8 0x01 }
for {set t 13} {$t < 26} {incr t} {
    after time $t [list watch "t$t"]
}
after time 26 { watch "t26"; after time 1 { exit } }
