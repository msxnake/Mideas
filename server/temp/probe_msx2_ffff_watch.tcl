set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/probe_msx2_ffff_watch.log"
set f [open $log_path "w"]
set hit_count 0

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
    set af [reg AF]
    set bc [reg BC]
    set de [reg DE]
    set hl [reg HL]
    set p1 [mem8 0xC153]
    set p2 [mem8 0xC154]
    set p3 [mem8 0xC155]
    set active [mem8 0xE726]
    set setup [mem8 0xE753]
    logline [format "%s pc=%04X sp=%04X af=%04X bc=%04X de=%04X hl=%04X banks=%02X/%02X/%02X music=%02X setup=%02X" $tag $pc $sp $af $bc $de $hl $p1 $p2 $p3 $active $setup]
}

debug set_bp 0x4010 {} {
    state "BP_4010"
    debug cont
}

debug set_watchpoint write 0xFFFF {
    global hit_count
    incr hit_count
    state "WP_FFFF_$hit_count"
    if {$hit_count >= 20} {
        close $::f
        exit
    }
    return ""
}

foreach t {3 4 5 6 7 8 9 10 12 15} {
    after time $t [list state "t_$t"]
}
after time 16 { close $f; exit }
