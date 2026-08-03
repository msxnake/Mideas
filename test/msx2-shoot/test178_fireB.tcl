# test178: does pressing B actually spawn a bullet?
#
# Pool slot 0 = #C0DA: +0 active, +1 x, +2 y, +3 dir   (STRIDE 4)
# Fire key B = keyboard matrix row 2, bit 7 (0x80).
#
# SPACE taps first in case the project's presentation/gameflow needs dismissing.

set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shoot/test178_fireB.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }

set ever_active 0
set first_seen ""
set x_start -1
set x_last -1
set frames_alive 0

proc watch {} {
    global ever_active first_seen x_start x_last frames_alive
    if {[mem8 0xC0DA]} {
        if {!$ever_active} {
            set ever_active 1
            set first_seen "x=[mem8 0xC0DB] y=[mem8 0xC0DC] dir=[mem8 0xC0DD] (player_x=[mem8 0xC001] facing=[mem8 0xC008])"
            set x_start [mem8 0xC0DB]
        }
        incr frames_alive
        set x_last [mem8 0xC0DB]
    }
    after frame watch
}

after time 2 { watch }

# Dismiss any title/presentation screen.
foreach t {3 4 5} {
    after time $t                 "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}]  "keymatrixup 8 0x01"
}

after time 7 { logline "before B: pool_active=[mem8 0xC0DA] cooldown=[mem8 0xC0E6] lock=[mem8 0xC0E7]" }

# Press B (row 2, bit 7) three times.
foreach t {8 10 12} {
    after time $t                 "keymatrixdown 2 0x80"
    after time [expr {$t + 0.3}]  "keymatrixup 2 0x80"
}

after time 15 {
    logline "bullet ever active : $ever_active"
    logline "first spawn        : $first_seen"
    logline "x start -> last    : $x_start -> $x_last  over $frames_alive frames"
    logline "cooldown/lock now  : [mem8 0xC0E6] / [mem8 0xC0E7]"
    after time 1 { exit }
}
