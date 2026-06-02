# Validate push box on push_example1_new.rom (reference timing + dense samples)
set ss_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
set log_path "$ss_dir/box2_push_validate.txt"

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
        set go [debug read memory 0xC012]
        set saty [debug read memory 0x1E44]
        set satx [debug read memory 0x1E45]
        set pat [debug read memory 0x1E46]
        log_msg "\[$label\] px=$px py=$py box=($bx,$by) slot=$ms mode=$mm go=$go sat=($saty,$satx) pat=$pat"
    } err {
        log_msg "\[$label\] ERR=$err"
    }
}

set lf [open $log_path "w"]
puts $lf "=== box2 push validate ==="
close $lf

after time 6.0 { probe BOOT }
after time 6.2 { keymatrixdown 8 128 }
foreach t {6.5 7.0 7.5 8.0 8.5 9.0 9.5 10.0 10.5 11.0 11.5 12.0 12.5} {
    after time $t "probe T$t"
}
after time 13.0 { keymatrixup 8 128; probe RELEASE }
after time 13.5 { log_msg DONE; catch {screenshot "$ss_dir/box2_push_validate.png"}; after time 0.3 exit }
