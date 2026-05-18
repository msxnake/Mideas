set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/probe_msx2_psg_regs.log"
set f [open $log_path "w"]
set rout_count 0
set reset_count 0

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

proc regs14 {} {
    set out ""
    for {set i 0} {$i < 14} {incr i} {
        append out [format "%02X" [mem8 [expr {0xE893 + $i}]]]
        if {$i < 13} { append out " " }
    }
    return $out
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC153]
    set p2 [mem8 0xC154]
    set p3 [mem8 0xC155]
    set active [mem8 0xE726]
    set muted [mem8 0xE727]
    set setup [mem8 0xE753]
    set delay [mem8 0xE76F]
    set cnt [mem8 0xE7CD]
    set mix [mem8 0xE89A]
    set va [mem8 0xE89B]
    set vb [mem8 0xE89C]
    set vc [mem8 0xE89D]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X music=%02X muted=%02X setup=%02X delay=%02X cnt=%02X mix=%02X vol=%02X/%02X/%02X regs={%s}" $tag $pc $sp $p1 $p2 $p3 $active $muted $setup $delay $cnt $mix $va $vb $vc [regs14]]
}

debug set_bp 0x4010 {} {
    global reset_count
    incr reset_count
    state "BP_4010_$reset_count"
    debug cont
}

debug set_bp 0x6810 {} {
    global rout_count
    incr rout_count
    if {$rout_count <= 16} {
        state "PT3_ROUT_$rout_count"
    }
    debug cont
}

foreach t {1 2 3 4 5 6 8 10 12 15 20 25 30} {
    after time $t [list state "t_$t"]
}

after time 32 {
    global f rout_count reset_count
    logline [format "done rout_count=%d reset_count=%d" $rout_count $reset_count]
    close $f
    exit
}
