set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-light/key_diag.txt"
set f [open $log_path "w"]
proc logline {m} { global f; puts $f $m; flush $f }
set throttle off
proc mem8 {a} { return [debug read memory $a] }
set introAlive 1
proc poker {} {
    global introAlive
    if {!$introAlive} { return }
    if {$::vb > 3} { set introAlive 0 ; keymatrixup 8 0x01 ; logline "intro passed"; return }
    keymatrixdown 8 0x01
    after time 0.25 { keymatrixup 8 0x01 }
    after time 0.75 poker
}
set vb 0
set n 0
set stage 0
debug set_bp 0x6086 {} {
    incr ::vb
    if {$::vb % 60 == 0} {
        logline [format "vb=%d px=%d py=%d lx=%d ly=%d on=%d act=%d stg=%d" $::vb [mem8 0xC001] [mem8 0xC002] [mem8 0xD223] [mem8 0xD224] [mem8 0xD240] [mem8 0xD227] [mem8 0xD241]]
    }
    # keep light on
    debug write memory 0xD227 1
    debug write memory 0xD240 1
    debug write memory 0xD242 0xFF
    debug write memory 0xD243 0xFF
    # staged input program
    if {$::vb == 200} { logline "--- SPACE down" ; keymatrixdown 8 0x01 }
    if {$::vb == 320} { keymatrixup 8 0x01 ; logline "--- SPACE up" }
    if {$::vb == 400} { logline "--- RIGHT down" ; keymatrixdown 8 0x80 }
    if {$::vb == 520} { keymatrixup 8 0x80 ; logline "--- RIGHT up" }
    if {$::vb == 600} { logline "--- UP down (row7 bit0)" ; keymatrixdown 7 0x01 }
    if {$::vb == 720} { keymatrixup 7 0x01 ; logline "--- UP up" }
    if {$::vb == 800} { logline "--- Z down (row6 bit0)" ; keymatrixdown 6 0x01 }
    if {$::vb == 920} { keymatrixup 6 0x01 ; logline "--- Z up" }
    if {$::vb == 1000} { logline "--- M down (row2 bit2)" ; keymatrixdown 2 0x04 }
    if {$::vb == 1120} { keymatrixup 2 0x04 ; logline "--- M up" }
    if {$::vb == 1200} { logline "--- stage poke cycle" ; debug write memory 0xD241 2 }
    if {$::vb == 1400} { logline "DIAG-DONE" ; close $f ; exit }
    debug cont
}
logline "key_diag start"
after time 0.5 poker
