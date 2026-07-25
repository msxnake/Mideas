set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_smoke.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }

# boss_active #C168, boss_x #C169, boss_y #C16A, boss_hp #C16F, player_health #C1FD
proc sample {tag} {
    logline [format "%s active=%d x=%d y=%d hp=%d player_hp=%d screen=%d" \
        $tag [mem8 0xC168] [mem8 0xC169] [mem8 0xC16A] [mem8 0xC16F] \
        [mem8 0xC1FD] [mem8 0xC00B]]
}

after time 6  { keymatrixdown 8 0x01 }
after time 7  { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 9  { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 11 { keymatrixup 8 0x01 }

after time 13 { sample "t13" }
after time 15 {
    sample "t15"
    screenshot -prefix boss_smoke_a_
}
after time 17 {
    sample "t17"
    screenshot -prefix boss_smoke_b_
    after time 1 { exit }
}
