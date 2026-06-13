set fh [open "C:/Users/salam/Documents/Programacion/Mideas/test/mini_boot.txt" w]
puts $fh "script loaded"
close $fh
after time 3 {
    set fh [open "C:/Users/salam/Documents/Programacion/Mideas/test/mini.txt" w]
    puts $fh "alive y=[debug read memory 0xC001]"
    close $fh
    exit
}
