# Deterministic compact Boss Death FX visual probe.
# Sequence: authored frame 1 -> frame 2 -> frame 3 -> implicit full Boss HMMM.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_death_restore_probe.txt"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss"
set f [open $log_path "w"]
set speed 100

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }

set CURRENT_SCREEN 0xC00B
set BOSS_ACTIVE    0xD08E
set DEATH_LEFT     0xD0F1
set DEATH_TICK     0xD0F2
set DEATH_SEED     0xD0F3

proc sample {tag} {
    global CURRENT_SCREEN BOSS_ACTIVE DEATH_LEFT DEATH_TICK
    logline [format "%s pc=%04X screen=%d boss=%d left=%d tick=%d" $tag \
        [reg PC] [mem8 $CURRENT_SCREEN] [mem8 $BOSS_ACTIVE] \
        [mem8 $DEATH_LEFT] [mem8 $DEATH_TICK]]
}
proc shot {name tag} {
    global shot_dir
    sample $tag
    screenshot "$shot_dir/$name"
    logline "SHOTOK $name"
}

foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}

after time 12.30 { shot "boss_death_restore_alive.png" "alive" }
after time 12.50 {
    # 10 authored explosions * (3 bitmap frames + 1 implicit body rebuild).
    debug write memory 0xD0F1 40
    debug write memory 0xD0F2 1
    debug write memory 0xD0F3 0xA5
    debug write memory 0xD08E 2
    sample "armed"
}
after time 12.55 { shot "boss_death_restore_frame1.png" "frame1" }
after time 12.63 { shot "boss_death_restore_frame2.png" "frame2" }
after time 12.71 { shot "boss_death_restore_frame3.png" "frame3" }
after time 12.80 { shot "boss_death_restore_clean.png" "rebuilt" }
after time 12.86 {
    sample "next_cycle"
    close $f
    exit
}
