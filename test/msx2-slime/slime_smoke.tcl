
# SlimeCeiling smoke: samples slot-0 slime state while the ROM runs.
# Pool slot 0 (from slime.sym): base #C12B -> x=#C12B y=#C12C dx=#C12D
# mode=#C138 travelPx=#C140 travelCount=#C141 phase=#C142.
# phase: 0=floor crawl, 1=rising, 2=ceiling crawl, 3=falling.
set result_path "test/msx2-slime/slime_smoke.txt"
set f [open $result_path w]
puts $f "t scr count x y dx phase travelCount playerHealth"
close $f

proc sample {t} {
    global result_path
    set f [open $result_path a]
    set scr   [debug read memory 0xC00B]
    set cnt   [debug read memory 0xC12A]
    set x     [debug read memory 0xC12B]
    set y     [debug read memory 0xC12C]
    set dx    [debug read memory 0xC12D]
    set ph    [debug read memory 0xC142]
    set tc    [debug read memory 0xC141]
    set hp    [debug read memory 0xC1FD]
    puts $f "$t $scr $cnt $x $y $dx $ph $tc $hp"
    close $f
}

# Skip the Screen5Presentation (waitForKey) with SPACE presses.
after time 6  { keymatrixdown 8 0x01 }
after time 7  { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 9  { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 11 { keymatrixup 8 0x01 }

# Sample the slime every 0.25 s between t=12 s and t=37 s.
for {set i 0} {$i < 100} {incr i} {
    set t [expr {12.0 + $i * 0.25}]
    after time $t "sample $t"
}

after time 14 { screenshot test/msx2-slime/slime_floor.png }
after time 20 { screenshot test/msx2-slime/slime_mid.png }
after time 26 { screenshot test/msx2-slime/slime_late.png }
after time 38 { exit }
