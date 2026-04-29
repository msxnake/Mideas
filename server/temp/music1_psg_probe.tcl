set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/music1_psg_probe.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc psg {reg} { return [debug read {PSG regs} $reg] }

proc state {tag} {
    set row [mem8 0xE47E]
    set cd [mem8 0xE47B]
    set na [mem8 0xE488]
    set nb [mem8 0xE489]
    set nc [mem8 0xE48A]
    set va [psg 8]
    set vb [psg 9]
    set vc [psg 10]
    set ta [expr {[psg 0] | (([psg 1] & 0x0F) << 8)}]
    set tb [expr {[psg 2] | (([psg 3] & 0x0F) << 8)}]
    set tc [expr {[psg 4] | (([psg 5] & 0x0F) << 8)}]
    set noise [psg 6]
    set mix [psg 7]
    logline [format "%s row=%02X cd=%02X notes=%02X/%02X/%02X tone=%03X/%03X/%03X vol=%02X/%02X/%02X noise=%02X mix=%02X" $tag $row $cd $na $nb $nc $ta $tb $tc $va $vb $vc $noise $mix]
}

after time 4.0 { state "t04" }
after time 4.1 { state "t04_1" }
after time 4.2 { state "t04_2" }
after time 4.3 { state "t04_3" }
after time 4.4 { state "t04_4" }
after time 4.5 { state "t04_5" }
after time 4.6 { state "t04_6" }
after time 4.7 { state "t04_7" }
after time 4.8 { state "t04_8" }
after time 4.9 { state "t04_9" }
after time 5.0 { state "t05" }
after time 5.1 { state "t05_1" }
after time 5.2 { state "t05_2" }
after time 5.3 { state "t05_3" }
after time 5.4 { state "t05_4" }
after time 5.5 { state "t05_5" }
after time 5.6 { state "t05_6" }
after time 5.7 { state "t05_7" }
after time 5.8 { state "t05_8" }
after time 5.9 { state "t05_9" }
after time 6.0 {
    state "final"
    close $f
    exit
}
