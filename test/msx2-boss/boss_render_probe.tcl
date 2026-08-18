# Does the boss body actually appear? One sample, one picture, then quit.
set out "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/out/boss_render.txt"
set f [open $out "w"]
proc logline {m} { global f; puts $f $m; flush $f }
for {set t 4} {$t < 15} {incr t} {
    after time $t                "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 20 {
    logline "screen=[debug read memory 0xC00B] active=[debug read memory 0xD16D] x=[debug read memory 0xD16E] y=[debug read memory 0xD16F] frame=[debug read memory 0xD176]"
    screenshot -prefix bossrender_
    logline "done"
    after time 1 { exit }
}
