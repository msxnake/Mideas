# Long push-box probe (timing aligned with mymsxgame1_3_13_pushbox_fix.tcl)
set ss_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
set log_path "$ss_dir/box2_slide_probe_long.txt"

proc log_msg {msg} {
    global log_path
    set lf [open $log_path "a"]
    puts $lf $msg
    close $lf
}

proc probe {label} {
    catch {
        set px [debug read memory 0xC000]
        set py [debug read memory 0xC001]
        set bx [debug read memory 0xC04F]
        set by [debug read memory 0xC057]
        set ms [debug read memory 0xC04C]
        set mm [debug read memory 0xC04E]
        set saty [debug read memory 0x1E44]
        set satx [debug read memory 0x1E45]
        set pat [debug read memory 0x1E46]
        log_msg "\[$label\] player=($px,$py) box=($bx,$by) slot=$ms mode=$mm sat=($saty,$satx) pat=$pat"
    } err {
        log_msg "\[$label\] ERR=$err"
    }
}

set lf [open $log_path "w"]
puts $lf "=== box2 long probe push_example1_new.rom ==="
close $lf

after time 6.0 { probe BOOT }
after time 6.2 { keymatrixdown 8 128 }
after time 8.0 { probe WALK }
after time 9.5 { probe AT_BOX }
after time 11.0 { probe PUSHING }
after time 12.5 { keymatrixup 8 128; probe AFTER }
after time 13.0 { log_msg DONE; catch {screenshot "$ss_dir/box2_push_long.png"}; after time 0.3 exit }
