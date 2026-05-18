set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/probe_pt3_reset.log"
set f [open $log_path "w"]
set reset_count 0

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC153]
    set p2 [mem8 0xC154]
    set p3 [mem8 0xC155]
    set active [mem8 0xE726]
    set muted [mem8 0xE727]
    set loop [mem8 0xE728]
    set track [mem8 0xE729]
    set setup [mem8 0xE753]
    set pt3lo [mem8 0xE754]
    set pt3hi [mem8 0xE755]
    set delay [mem8 0xE76F]
    set delycnt [mem8 0xE7CD]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X music=%02X muted=%02X loop=%02X track=%02X setup=%02X pt3mod=%02X%02X delay=%02X cnt=%02X" $tag $pc $sp $p1 $p2 $p3 $active $muted $loop $track $setup $pt3hi $pt3lo $delay $delycnt]
}

debug set_bp 0x4010 {} {
    global reset_count
    incr reset_count
    state "BP_4010_RESET_$reset_count"
    debug cont
}

after time 0.5 { state "t_0_5" }
after time 1.0 { state "t_1_0" }
after time 2.0 { state "t_2_0" }
after time 3.0 { state "t_3_0" }
after time 4.0 { state "t_4_0" }
after time 5.0 { state "t_5_0" }
after time 6.0 { state "t_6_0" }
after time 8.0 { state "t_8_0" }
after time 10.0 { state "t_10_0" }
after time 12.0 { state "t_12_0" }
after time 15.0 { state "t_15_0" }
after time 20.0 { state "t_20_0" }
after time 25.0 { state "t_25_0" }
after time 30.0 { state "t_30_0"; close $f; exit }
