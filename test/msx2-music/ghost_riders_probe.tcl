# Proves the SCREEN 5 bitmap ROM actually plays its PSG track: samples the AY
# registers over one full loop and reports tone periods and volumes. A silent
# ROM shows volumes pinned at 0 and periods that never move.
set base "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-music"
set f [open "$base/ghost_riders_probe.txt" "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }

proc psg {n} { return [debug read "PSG regs" $n] }

# Tone period per channel is a 12-bit little-endian pair; volume is R8-R10.
proc period {ch} { return [expr {[psg [expr {$ch*2}]] | (([psg [expr {$ch*2+1}]] & 0x0F) << 8)}] }
proc vol {ch} { return [expr {[psg [expr {8+$ch}]] & 0x1F}] }

set changes 0
set prev "none"
set maxvol 0

proc sample {tag} {
    global changes prev maxvol
    set a [period 0]; set b [period 1]; set c [period 2]
    set va [vol 0]; set vb [vol 1]; set vc [vol 2]
    set mix [psg 7]
    set now "$a/$b/$c"
    if {$now ne $prev} { incr changes; set prev $now }
    foreach v [list $va $vb $vc] { if {$v > $maxvol} { set maxvol $v } }
    logline [format "%-6s A=%4d(v%2d)  B=%4d(v%2d)  C=%4d(v%2d)  mix=%02X" \
        $tag $a $va $b $vb $c $vc $mix]
}

# One loop is ~15.4 s; sample across it plus the wrap back to the start.
for {set t 2} {$t <= 18} {incr t} {
    after time $t [list sample "t$t"]
}

after time 3  { screenshot "$base/ghost_riders_scene.png" }

after time 19 {
    logline "----"
    logline "distinct tone-period states: $changes (a silent ROM stays at 1)"
    logline "peak channel volume: $maxvol (0 means nothing was ever audible)"
    if {$changes < 5 || $maxvol == 0} {
        logline "RESULT: FAIL - the ROM is not producing music"
    } else {
        logline "RESULT: PASS - PSG is being driven"
    }
    close $f
    exit
}
