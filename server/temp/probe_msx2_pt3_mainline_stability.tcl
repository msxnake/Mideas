set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/probe_msx2_pt3_mainline_stability.log"
set f [open $log_path "w"]
set reset_count 0
set tick_count 0

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} {
    if {[catch {debug read memory $addr} value]} {
        return -1
    }
    return $value
}

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
    set inirq [mem8 0xE720]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X music=%02X setup=%02X delay=%02X cnt=%02X inirq=%02X" $tag $pc $sp $p1 $p2 $p3 $active $setup $delay $delycnt $inirq]
}

debug set_bp 0x4010 {} {
    global reset_count
    incr reset_count
    state "BP_4010_$reset_count"
    debug cont
}

proc tick {} {
    global tick_count reset_count f
    incr tick_count
    state "t_$tick_count"
    if {$tick_count >= 40} {
        logline [format "done reset_count=%d" $reset_count]
        close $f
        exit
    }
    after time 1 tick
}

after time 1 tick
