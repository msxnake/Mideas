set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/probe_pt3_reset_long.log"
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
    set setup [mem8 0xE753]
    set delay [mem8 0xE76F]
    set delycnt [mem8 0xE7CD]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X music=%02X setup=%02X delay=%02X cnt=%02X" $tag $pc $sp $p1 $p2 $p3 $active $setup $delay $delycnt]
}

debug set_bp 0x4010 {} {
    global reset_count
    incr reset_count
    state "BP_4010_RESET_$reset_count"
    debug cont
}

foreach t {3 4 5 10 20 30 45 60 75 90 105 120} {
    after time $t [list state "t_$t"]
}
after time 122 { close $f; exit }
