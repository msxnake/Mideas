set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc60_ascii16_oldhook_watch.log"
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc bytes5 {addr} {
    return [format "%02X%02X%02X%02X%02X" [mem8 $addr] [mem8 [expr {$addr + 1}]] [mem8 [expr {$addr + 2}]] [mem8 [expr {$addr + 3}]] [mem8 [expr {$addr + 4}]]]
}

proc state {tag} {
    set pc [reg PC]; set sp [reg SP]
    set p1 [mem8 0xC11B]; set p2 [mem8 0xC11C]; set p3 [mem8 0xC11D]; set p4 [mem8 0xC11E]
    set flow [mem8 0xC104]; set screen [mem8 0xE129]; set irq [mem16 0xE7CB]; set inirq [mem8 0xE7D0]
    set old [bytes5 0xE7C6]
    set px [mem16 0xE133]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X inirq=%02X old=%s px=%d" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $irq $inirq $old $px]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state "${tag}_before"; down 1; after time 0.20 [list up 1]; after time 0.25 [list state "${tag}_after"] }

set oldhook_writes 0
proc oldhook_write {} {
    global oldhook_writes wp_last_address wp_last_value
    if {$oldhook_writes < 80} {
        state [format "WP_OLDHOOK addr=%04X val=%02X" $wp_last_address $wp_last_value]
    }
    incr oldhook_writes
    debug cont
}

after time 3.8 {
    state "before_watch"
    debug set_watchpoint write_mem {0xE7C6 0xE7CA} {} { oldhook_write }
    logline "watch installed"
}
after time 7.0 { tap_space "space1" }
after time 9.0 { tap_space "space2" }
after time 12.0 {
    state "t12"
    global oldhook_writes
    logline [format "oldhook_writes=%d" $oldhook_writes]
    close $f
    exit
}
