# MyMSXGame1(3)13 platform demo — screenshots + RAM log
set ss_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots/demo_mymsxgame1_3_13"
set log_path "$ss_dir/demo_log.txt"

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
    log_msg "SNAP $name rc=$rc out=$out"
}

proc probe {label} {
    global log_path
    set px [debug read memory 0xC000]
    set py [debug read memory 0xC001]
    set bx [debug read memory 0xC04F]
    set by [debug read memory 0xC057]
    set ms [debug read memory 0xC04C]
    set go [debug read memory 0xC035]
    log_msg "\[$label\] player=($px,$py) box=($bx,$by) slot=$ms gameover=$go"
}

set lf [open $log_path "w"]
puts $lf "=== MyMSXGame1(3)13 demo v2 ==="
close $lf

after time 6.0 { probe BOOT; snap "01_boot" }
after time 6.2 { keymatrixdown 8 128 }
after time 8.0 { probe WALKING; snap "02_walking_right" }
after time 9.5 { probe AT_BOX; snap "03_at_box" }
after time 11.0 { probe PUSHING; snap "04_pushing_box" }
after time 12.5 { keymatrixup 8 128; probe PUSH_RELEASE; snap "05_after_push" }
after time 13.0 { keymatrixdown 8 64 }
after time 13.8 { keymatrixup 8 64 }
after time 14.0 { probe AFTER_JUMP; snap "06_after_jump" }
after time 14.2 { keymatrixdown 8 128 }
after time 15.5 { probe SPIKE_APPROACH; snap "07_spike_approach" }
after time 16.5 { probe SPIKE_CONTACT; snap "08_spike_contact" }
after time 17.0 { keymatrixdown 8 64 }
after time 17.8 { keymatrixup 8 64; keymatrixup 8 128 }
after time 18.0 { probe SPIKE_JUMP; snap "09_spike_jump" }
after time 19.0 { probe FINAL; snap "10_final"; log_msg DONE; after time 0.3 exit }
