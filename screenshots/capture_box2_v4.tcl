# Box2 push test v4 — alignment fix + extended RAM probe
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
        set py [debug read memory 0xC001]
        set bx [debug read memory 0xC04F]
        set by [debug read memory 0xC057]
        set ms [debug read memory 0xC04C]
        set cnt [debug read memory 0xC047]
        log_msg "\[$label\] player=($px,$py) box=($bx,$by) moving_slot=$ms count=$cnt"
    }
}

set lf [open $log_path "w"]
puts $lf "=== Box2 push v4 (alignment fix) ==="
close $lf

after time 7.0 { probe IDLE; catch {screenshot "$ss_dir/box2_v4_01_idle.png"} }
after time 7.1 { keymatrixdown 8 128 }
after time 8.5 { probe PUSHING; catch {screenshot "$ss_dir/box2_v4_02_pushing.png"} }
after time 9.1 { probe HOLD; catch {screenshot "$ss_dir/box2_v4_03_hold.png"} }
after time 9.6 { keymatrixup 8 128 }
after time 9.72 { probe RELEASE; catch {screenshot "$ss_dir/box2_v4_04_release.png"}; log_msg "DONE"; after time 0.2 exit }
