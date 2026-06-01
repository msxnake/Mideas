set log_path "C:/Users/salam/Documents/Programacion/Mideas/screenshots/box2_wait_log.txt"
set lf [open $log_path "w"]
puts $lf "wait-only start"
close $lf
after time 12.000 {
    set lf [open $log_path "a"]
    puts $lf "wait-only done at 12s"
    close $lf
    exit
}
