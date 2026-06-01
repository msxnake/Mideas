set log_path "C:/Users/salam/Documents/Programacion/Mideas/screenshots/box2_debug_boot.txt"
proc log {msg} {
    global log_path
    set lf [open $log_path "a"]
    puts $lf $msg
    close $lf
}
set lf [open $log_path "w"]
puts $lf "boot probe"
close $lf
foreach t {0.5 1.0 2.0 3.0 4.0 5.0 6.0 7.0 8.0} {
    after time $t [list log "T=$t PC=[debug read reg PC]"]
}
after time 9.0 exit
