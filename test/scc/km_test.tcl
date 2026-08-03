set fh [open "C:/Users/salam/Documents/Programacion/Mideas/test/scc/km_test.txt" w]
catch { set renderer none }
catch { set throttle off }
after time 1 {
    if {[catch {keymatrix down 8 1} err]} { puts $fh "keymatrix ERROR: $err" } else { puts $fh "keymatrix OK" }
    puts $fh "commands: [lsearch -all -inline [info commands key*] *]"
    close $fh
    exit
}
