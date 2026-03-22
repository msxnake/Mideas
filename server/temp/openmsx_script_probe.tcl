set __fh [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_script_probe.log" w]
puts $__fh "SCRIPT_OK"
close $__fh
after 1000 {
    set __fh2 [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_script_probe.log" a]
    puts $__fh2 "AFTER_OK"
    close $__fh2
    exit
}
