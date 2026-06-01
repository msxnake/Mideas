# Box2 frame-by-frame probe while pushing right
set ss_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
set log_path "$ss_dir/box2_frame_log.txt"

proc log_msg {msg} {
    global log_path
    set lf [open $log_path "a"]
    puts $lf $msg
    close $lf
}

proc log_frame {t} {
    catch {
        set px [debug read memory 0xC000]
        set ms [debug read memory 0xC04C]
        set bx [debug read memory 0xC04F]
        set tr [debug read memory 0xC04A]
        set ac [debug read memory 0xC04B]
        set by [debug read memory 0xC057]
        set cnt [debug read memory 0xC047]
        set pb [debug read memory 0xC03C]
        set pc [debug read memory 0xC03D]
        set dx [debug read memory 0xC048]
        log_msg "t=$t px=$px dx=$dx probe=($pb,$pc) box=($bx,$by) find=$tr"
    }
}

set lf [open $log_path "w"]
puts $lf "=== frame probe ==="
close $lf

after time 7.00 { log_frame 7.00 }
after time 7.10 { log_frame 7.10 }
after time 7.20 { log_frame 7.20 }
after time 7.30 { log_frame 7.30 }
after time 7.40 { log_frame 7.40 }
after time 7.50 { log_frame 7.50 }
after time 7.60 { log_frame 7.60 }
after time 7.70 { log_frame 7.70 }
after time 7.80 { log_frame 7.80 }
after time 7.90 { log_frame 7.90 }
after time 8.00 { log_frame 8.00 }
after time 8.10 { log_frame 8.10 }
after time 8.20 { log_frame 8.20 }
after time 8.30 { log_frame 8.30 }
after time 8.40 { log_frame 8.40 }
after time 8.50 { log_frame 8.50 }
after time 8.60 { log_frame 8.60 }
after time 8.70 { log_frame 8.70 }
after time 8.80 { log_frame 8.80 }
after time 8.90 { log_frame 8.90 }
after time 9.00 { log_frame 9.00 }
after time 9.10 { log_frame 9.10 }
after time 9.20 { log_frame 9.20 }

after time 7.05 { keymatrixdown 8 128 }
after time 9.25 { keymatrixup 8 128 }
after time 9.35 { log_msg DONE; catch {screenshot "$ss_dir/box2_v5_final.png"}; after time 0.2 exit }
