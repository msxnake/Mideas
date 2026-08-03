# Diagnostic: is the game loop even alive, and does RIGHT move the player?
# If player_x never changes we are stuck on a title/presentation screen and the
# B result is meaningless.

set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shoot/test178_diag.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }

proc snap {tag} {
    logline "$tag  player_x=[mem8 0xC001] facing=[mem8 0xC008] screen=[mem8 0xC00B] pool=[mem8 0xC0DA] cd=[mem8 0xC0E6] lock=[mem8 0xC0E7]"
}

after time 2  { snap "t=2 " }
after time 5  { snap "t=5 " }
after time 8  { snap "t=8 " }

# Dismiss title / presentation generously.
foreach t {9 10 11 12 13 14} {
    after time $t                 "keymatrixdown 8 0x01"
    after time [expr {$t + 0.25}] "keymatrixup 8 0x01"
}
after time 16 { snap "t=16 after SPACE taps" }

# Walk RIGHT for 2s -> player_x must change if the game loop runs.
after time 17 { keymatrixdown 8 0x80 }
after time 19 { keymatrixup 8 0x80 ; snap "t=19 after RIGHT" }

# Now hold B for a full second.
after time 20 { keymatrixdown 2 0x80 }
after time 21 { keymatrixup 2 0x80 ; snap "t=21 after B held 1s" }

after time 22 { after time 1 { exit } }
