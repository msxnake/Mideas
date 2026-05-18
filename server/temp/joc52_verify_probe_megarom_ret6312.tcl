set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_megarom_ret6312.log"
set f [open $log_path "w"]
set ::hit 0

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

proc map_state {} {
    set p1 [mem8 0xC11B]
    set p2 [mem8 0xC11C]
    set p3 [mem8 0xC11D]
    set saved [mem8 0xC120]
    return [format "p=%02X/%02X/%02X saved=%02X" $p1 $p2 $p3 $saved]
}

proc log_disasm {addr} {
    for {set a [expr {$addr - 10}]} {$a < [expr {$addr + 14}]} {incr a} {
        if {[catch {debug disasm $a} d]} {
            logline [format "DIS %04X ERR %s" $a $d]
        } else {
            logline [format "DIS %04X %s" $a $d]
        }
    }
}

proc trace_wrt {} {
    set h [reg H]
    set l [reg L]
    set hl [expr {($h << 8) | $l}]
    if {$hl < 0x1800 || $hl >= 0x1B00} { return }
    set sp [reg SP]
    set ret [mem16 $sp]
    if {$ret != 0x6312} { return }
    incr ::hit
    set a [reg A]
    logline [format "HIT n=%d ret=%04X hl=%04X a=%02X sp=%04X %s" $::hit $ret $hl $a $sp [map_state]]
    if {$::hit == 1} {
        log_disasm $ret
    }
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {} {
    down 1
    after time 0.20 { up 1 }
}

debug set_bp 0x40E6 {} {
    trace_wrt
    debug cont
}

after time 7.0  { tap_space }
after time 12.0 { tap_space }
after time 13.4 { logline [format "done hits=%d %s" $::hit [map_state]]; close $f; exit }
