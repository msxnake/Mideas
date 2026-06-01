# MyMSXGame1(3)13 — jump/spike demo (SPACE = jump)
set ss_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots/demo_mymsxgame1_3_13"
set log_path "$ss_dir/demo_spikes_log.txt"

proc log_msg {msg} {
    global log_path
    set lf [open $log_path "a"]
    puts $lf $msg
    close $lf
}

proc snap {name} {
    global ss_dir
    set path "$ss_dir/${name}.png"
    set rc [catch {screenshot $path} out]
    log_msg "SNAP $name rc=$rc"
}

proc probe {label} {
    set px [debug read memory 0xC000]
    set py [debug read memory 0xC001]
    log_msg "\[$label\] player=($px,$py)"
}

set lf [open $log_path "w"]
puts $lf "=== spike demo ==="
close $lf

after time 6.0 { probe START; snap "11_start" }
# jump with SPACE (bit 0 row 8)
after time 6.2 { keymatrixdown 8 1 }
after time 6.55 { keymatrixup 8 1; probe JUMP1; snap "12_jump1" }
after time 7.0 { keymatrixdown 8 128 }
after time 8.5 { keymatrixup 8 128; probe RIGHT; snap "13_mid_air" }
after time 8.7 { keymatrixdown 8 1 }
after time 9.05 { keymatrixup 8 1; probe JUMP2; snap "14_jump2" }
after time 9.5 { keymatrixdown 8 128 }
after time 10.5 { probe ON_SPIKE_ROW; snap "15_spike_row" }
after time 11.0 { keymatrixdown 8 128 }
after time 12.0 { probe SPIKE_WALK; snap "16_spike_walk" }
after time 12.5 { log_msg DONE; after time 0.3 exit }
