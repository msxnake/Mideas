# Probe box2 slide: moving_slot, SAT #1E44, runtime position
set ss_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
set log_path "$ss_dir/box2_slide_probe.txt"

proc log_msg {msg} {
    global log_path
    set lf [open $log_path "a"]
    puts $lf $msg
    close $lf
}

proc log_state {tag} {
    catch {
        set px [debug read memory 0xC000]
        set ms [debug read memory 0xC04C]
        set mm [debug read memory 0xC04E]
        set bx [debug read memory 0xC04F]
        set by [debug read memory 0xC057]
        set saty [debug read memory 0x1E44]
        set satx [debug read memory 0x1E45]
        set pat [debug read memory 0x1E46]
        log_msg "$tag px=$px slot=$ms mode=$mm box=($bx,$by) sat=($saty,$satx) pat=$pat"
    } err {
        log_msg "$tag ERR=$err"
    }
}

set lf [open $log_path "w"]
puts $lf "=== box2 slide probe (push_example1_new.rom) ==="
close $lf

after time 6.50 { log_state idle }
after time 7.00 { log_state pre }
after time 7.05 { keymatrixdown 8 128 }
after time 7.15 { log_state t7.15 }
after time 7.30 { log_state t7.30 }
after time 7.50 { log_state t7.50 }
after time 7.70 { log_state t7.70 }
after time 8.00 { log_state t8.00 }
after time 8.30 { log_state t8.30 }
after time 8.60 { log_state t8.60 }
after time 9.00 { log_state t9.00 }
after time 9.25 { keymatrixup 8 128 }
after time 9.35 { log_state post }
after time 9.45 { log_msg DONE; catch {screenshot "$ss_dir/box2_push_sprite.png"}; after time 0.2 exit }
