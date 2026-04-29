set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_simple_audio_probe.log"
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

proc bytes {addr count} {
    set out ""
    for {set i 0} {$i < $count} {incr i} {
        append out [format "%02X" [mem8 [expr {$addr + $i}]]]
        if {$i + 1 < $count} { append out " " }
    }
    return $out
}

proc snapshot {tag} {
    set pc [reg PC]
    set mactive [mem8 0xEA92]
    set mmuted [mem8 0xEA93]
    set mloop [mem8 0xEA94]
    set mtrack [mem8 0xEA95]
    set pt3setup [mem8 0xEAB9]
    set pt3mod [mem16 0xEABA]
    set pt3delay [mem8 0xEAD5]
    set ayregs [bytes 0xEBF9 14]
    logline [format "%s pc=%04X music active=%02X muted=%02X loop=%02X track=%02X pt3setup=%02X mod=%04X delay=%02X ay=%s" $tag $pc $mactive $mmuted $mloop $mtrack $pt3setup $pt3mod $pt3delay $ayregs]
}

proc tap_space {tag} {
    snapshot "${tag}_before"
    keymatrixdown 8 1
    after time 0.22 { keymatrixup 8 1 }
}

after time 7.0 { tap_space "first" }
after time 12.0 { tap_space "start" }
after time 13.1 { snapshot "game_13_1" }
after time 13.6 { snapshot "game_13_6" }
after time 14.1 { snapshot "game_14_1" }
after time 14.6 { snapshot "game_14_6" }
after time 15.1 { snapshot "game_15_1" }
after time 15.6 {
    snapshot "game_15_6"
    close $f
    exit
}
