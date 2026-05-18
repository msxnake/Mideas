set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/probe_msx2_native_music_stability.log"
set f [open $log_path "w"]
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

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC153]
    set p2 [mem8 0xC154]
    set p3 [mem8 0xC155]
    set active [mem8 0xE726]
    set muted [mem8 0xE727]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X music=%02X muted=%02X" $tag $pc $sp $p1 $p2 $p3 $active $muted]
}

debug set_bp 0x4010 {} {
    global reset_count
    incr reset_count
    state "BP_4010_$reset_count"
    debug cont
}

foreach t {1 2 3 4 5 6 8 10 15 20 25 30} {
    after time $t [list state "t_$t"]
}

after time 32 {
    global f reset_count
    logline [format "done reset_count=%d" $reset_count]
    close $f
    exit
}
