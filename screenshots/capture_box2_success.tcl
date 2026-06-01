set ss_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
set log_path "$ss_dir/box2_success_log.txt"
proc log_frame {t} {
    catch {
        set lf [open $log_path "a"]
        puts $lf "t=$t px=[debug read memory 0xC000] bx=[debug read memory 0xC04F] ms=[debug read memory 0xC04C]"
        close $lf
    }
}
set lf [open $log_path "w"]
puts $lf "=== success probe ==="
close $lf
after time 7.0 { log_frame 7.0 }
after time 7.1 { keymatrixdown 8 128 }
after time 7.3 { log_frame 7.3 }
after time 7.5 { log_frame 7.5 }
after time 7.7 { log_frame 7.7 }
after time 7.9 { log_frame 7.9 }
after time 8.1 { log_frame 8.1 }
after time 8.3 { log_frame 8.3 }
after time 8.5 { log_frame 8.5 }
after time 8.7 { log_frame 8.7 }
after time 9.0 { keymatrixup 8 128 }
after time 9.1 { log_frame 9.1; catch {screenshot "$ss_dir/box2_success.png"}; after time 0.2 exit }
