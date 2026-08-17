# Runtime smoke for the professional bat project after the SAT/VBlank fix.

set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/t501"
set log [open "$dir/_professional_runtime_smoke.txt" "w"]
proc rb {addr} { debug read memory $addr }
proc L {msg} { global log; puts $log $msg; flush $log }

set ::POOL 0xD056
set ::STRIDE 26
set ::sample_index 0

proc sample_bat {} {
    set b0 $::POOL
    set b1 [expr {$::POOL + $::STRIDE}]
    L [format "f%02d body=%d,%d cd=%d eyes=%d,%d cd=%d r15=%02X" \
        $::sample_index \
        [rb $b0] [rb [expr {$b0+1}]] [rb [expr {$b0+23}]] \
        [rb $b1] [rb [expr {$b1+1}]] [rb [expr {$b1+23}]] \
        [debug read "VDP regs" 15]]
    incr ::sample_index
    if {$::sample_index < 37} { after frame sample_bat }
}

foreach t {3 4 5 6 7 8} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}] "keymatrixup 8 0x01"
}

after time 9.0 sample_bat
foreach t {9.10 9.20 9.30 9.40 9.50 9.60 9.70 9.80 9.90 10.00 10.10 10.20} {
    set suffix [string map {. _} $t]
    after time $t [list screenshot "$dir/_professional_smoke_$suffix.png"]
}
after time 10.5 {
    close $log
    exit
}
