set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_megarom_boss_copy.log"
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

proc bytes_memory {base count} {
    set out {}
    for {set i 0} {$i < $count} {incr i} {
        lappend out [format "%02X" [mem8 [expr {$base + $i}]]]
    }
    return [join $out " "]
}

proc map_state {} {
    return [format "p=%02X/%02X/%02X savedp3=%02X" [mem8 0xC11B] [mem8 0xC11C] [mem8 0xC11D] [mem8 0xC121]]
}

proc log_copy {tag} {
    if {[info exists ::copy_logs] == 0} { set ::copy_logs 0 }
    if {$::copy_logs >= 80} {
        debug cont
        return
    }
    incr ::copy_logs
    set pc [reg PC]
    set sp [reg SP]
    set src [bytes_memory 0xBFE8 11]
    set dst [bytes_memory 0xC00A 11]
    logline [format "%s pc=%04X sp=%04X %s srcBFE8=%s dstC00A=%s count=%02X table=%04X bank=%02X" $tag $pc $sp [map_state] $src $dst [mem8 0xC006] [mem16 0xC007] [mem8 0xC009]]
    debug cont
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {} {
    down 1
    after time 0.20 { up 1 }
}

debug set_bp 0x62BA {} { log_copy "AFTER_SET_BEFORE_SRC" }
debug set_bp 0x62C2 {} { log_copy "BEFORE_LDIR" }
debug set_bp 0x62C4 {} { log_copy "AFTER_LDIR" }
debug set_bp 0x62D3 {} { log_copy "BOSS_DONE" }

after time 7.0  { tap_space }
after time 12.0 { tap_space }
after time 13.0 { close $f; exit }
