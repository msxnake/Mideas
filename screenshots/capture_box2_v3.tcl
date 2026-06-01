# Box2 verification using proven pushbox timing
set ss_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
set log_path "$ss_dir/MyMSXGame1_box2_log.txt"

proc log_msg {msg} {
    global log_path
    set lf [open $log_path "a"]
    puts $lf $msg
    close $lf
    puts $msg
}

proc probe {label} {
    catch {
        set px [debug read memory 0xC000]
        set bx [debug read memory 0xC04F]
        set ms [debug read memory 0xC04C]
        log_msg "\[$label\] player_x=$px box_x=$bx moving_slot=$ms"
    }
}

set lf [open $log_path "w"]
puts $lf "=== Box2 push timing v3 ==="
close $lf

after time 7.0 { probe IDLE; catch {screenshot "$ss_dir/box2_v3_01_idle.png"} }
after time 7.1 { keymatrixdown 8 128 }
after time 9.1 { probe HOLD; catch {screenshot "$ss_dir/box2_v3_02_hold.png"} }
after time 9.6 { keymatrixup 8 128 }
after time 9.72 { probe RELEASE; catch {screenshot "$ss_dir/box2_v3_03_release.png"}; log_msg "DONE"; after time 0.2 exit }
