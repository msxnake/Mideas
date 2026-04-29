set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/music1_probe.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc state {tag} {
    set pc [reg PC]
    set irq [mem16 0xE46C]
    set active [mem8 0xE476]
    set muted [mem8 0xE477]
    set loop [mem8 0xE478]
    set row_frames [mem8 0xE47A]
    set cd [mem8 0xE47B]
    set order [mem8 0xE47C]
    set pattern [mem8 0xE47D]
    set row [mem8 0xE47E]
    set mix [mem8 0xE484]
    set na [mem8 0xE488]
    set nb [mem8 0xE489]
    set nc [mem8 0xE48A]
    set ia [mem8 0xE48B]
    set ib [mem8 0xE48C]
    set ic [mem8 0xE48D]
    set va [mem8 0xE491]
    set vb [mem8 0xE492]
    set vc [mem8 0xE493]
    set vsa [mem8 0xE494]
    set vsb [mem8 0xE495]
    set vsc [mem8 0xE496]
    logline [format "%s pc=%04X irq=%04X active=%02X muted=%02X loop=%02X rowFrames=%02X cd=%02X order=%02X pat=%02X row=%02X mix=%02X notes=%02X/%02X/%02X inst=%02X/%02X/%02X vol=%02X/%02X/%02X vstep=%02X/%02X/%02X" $tag $pc $irq $active $muted $loop $row_frames $cd $order $pattern $row $mix $na $nb $nc $ia $ib $ic $va $vb $vc $vsa $vsb $vsc]
}

state "boot"
after time 1.0 { state "t01" }
after time 2.0 { state "t02" }
after time 3.0 { state "t03" }
after time 4.0 { state "t04" }
after time 5.0 { state "t05" }
after time 6.0 { state "t06" }
after time 7.0 { state "t07" }
after time 8.0 { state "t08" }
after time 9.0 { state "t09" }
after time 10.0 { state "t10" }
after time 12.0 { state "t12" }
after time 15.0 { state "t15" }
after time 18.0 { state "t18" }
after time 20.0 {
    state "final"
    close $f
    exit
}
