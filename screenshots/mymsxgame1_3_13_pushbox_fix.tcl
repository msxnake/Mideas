# Quick push-box + spike verification after y+15 support fix
set ss_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots/demo_mymsxgame1_3_13"
set log_path "$ss_dir/pushbox_fix_log.txt"

proc log_msg {msg} {
    global log_path
    set lf [open $log_path "a"]
    puts $lf $msg
    close $lf
}

proc snap {name} {
    global ss_dir
    screenshot "$ss_dir/${name}.png"
}

proc probe {label} {
    set px [debug read memory 0xC000]
    set py [debug read memory 0xC001]
    set bx [debug read memory 0xC04F]
    set by [debug read memory 0xC057]
    set ms [debug read memory 0xC04C]
    set lives [debug read memory 0xC011]
    log_msg "\[$label\] player=($px,$py) box=($bx,$by) moving_slot=$ms lives=$lives"
}

set lf [open $log_path "w"]
puts $lf "=== pushbox fix verify ==="
close $lf

after time 6.0 { probe BOOT; snap "fix_01_boot" }
after time 6.2 { keymatrixdown 8 128 }
after time 8.0 { probe WALK_RIGHT; snap "fix_02_walk" }
after time 9.5 { probe AT_BOX; snap "fix_03_at_box" }
after time 11.0 { probe PUSHING; snap "fix_04_pushing" }
after time 12.5 { keymatrixup 8 128; probe AFTER_PUSH; snap "fix_05_after_push" }
after time 13.0 { keymatrixdown 8 1 }
after time 13.8 { keymatrixup 8 1 }
after time 14.2 { keymatrixdown 8 128 }
after time 16.0 { probe ON_SPIKES; snap "fix_06_spikes" }
after time 17.5 { probe SPIKE_HIT; snap "fix_07_spike_hit"; log_msg DONE; after time 0.3 exit }
