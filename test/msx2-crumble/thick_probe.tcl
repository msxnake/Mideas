set result_path "test/msx2-crumble/thick_probe.txt"
proc snap {label} {
    global result_path
    set f [open $result_path a]
    puts $f "$label pos=([debug read memory 0xC001],[debug read memory 0xC000]) grounded=[expr {[debug read memory 0xC007] & 1}] c(3,6)=[debug read memory 0xC073]"
    close $f
}
after time 4  { keymatrixdown 8 0x01 } ; after time 4.2 { keymatrixup 8 0x01 }
after time 5  { keymatrixdown 8 0x01 } ; after time 5.2 { keymatrixup 8 0x01 }
after time 6  { keymatrixdown 8 0x01 } ; after time 6.2 { keymatrixup 8 0x01 }
for {set i 0} {$i < 14} {incr i} { after time [expr {6.4 + $i * 0.2}] "snap t[expr {6.4 + $i * 0.2}]" }
after time 9.5 { snap "end" ; screenshot test/msx2-crumble/thick_end.png ; after time 1 { exit } }
