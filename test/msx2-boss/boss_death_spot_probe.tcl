# Compact Boss Death FX: consecutive blasts must land on DIFFERENT spots while
# the frames of one blast stay on the same one.
# One cycle = 3 authored frames + the implicit body rebuild, 5 frames each.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_death_spot_probe.txt"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss"
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }

set BOSS_ACTIVE 0xD08E
set DEATH_LEFT  0xD0F1
set DEATH_SEED  0xD0F3

proc shot {name tag} {
    global shot_dir BOSS_ACTIVE DEATH_LEFT DEATH_SEED
    logline [format "%s boss=%d left=%d seed=%d" $tag \
        [mem8 $BOSS_ACTIVE] [mem8 $DEATH_LEFT] [mem8 $DEATH_SEED]]
    screenshot "$shot_dir/$name"
    logline "SHOTOK $name"
}

foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}

after time 12.30 { shot "boss_death_spot_alive.png" "alive" }
after time 12.50 {
    debug write memory 0xD0F1 40
    debug write memory 0xD0F2 1
    debug write memory 0xD0F3 0xA5
    debug write memory 0xD08E 2
    logline "armed"
}
# Second frame of three consecutive blasts (one cycle = 4 steps x 5 frames).
# Same phase of three cycles: frame 2 of each blast (cycle = 4 steps x 5 frames
# = 0.3333 s), so the boxes are directly comparable.
after time 12.630 { shot "boss_death_spot_cycle1.png" "cycle1" }
after time 12.963 { shot "boss_death_spot_cycle2.png" "cycle2" }
after time 13.297 { shot "boss_death_spot_cycle3.png" "cycle3" }
after time 13.40 { close $f; exit }
