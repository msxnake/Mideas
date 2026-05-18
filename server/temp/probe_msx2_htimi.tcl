set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/probe_msx2_htimi.log"
set f [open $log_path "w"]
set hit_count 0

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
    set irqen [mem8 0xE71F]
    set inirq [mem8 0xE720]
    set ret0 [mem16 $sp]
    set ret1 [mem16 [expr {$sp + 2}]]
    set htimi [bytes 0xFD9F 8]
    set old [bytes 0xE716 8]
    logline [format "%s pc=%04X sp=%04X ret=%04X/%04X af=%04X bc=%04X de=%04X hl=%04X banks=%02X/%02X/%02X music=%02X irq=%02X inirq=%02X HTIMI={%s} OLD={%s}" $tag $pc $sp $ret0 $ret1 $af $bc $de $hl $p1 $p2 $p3 $active $irqen $inirq $htimi $old]
}

debug set_bp 0x4010 {} {
    global hit_count
    incr hit_count
    state "BP_4010_$hit_count"
    if {$hit_count >= 8} {
        close $::f
        exit
    }
    debug cont
}

foreach t {3 4 5 6 7 8 9 10 12 15} {
    after time $t [list state "t_$t"]
}
after time 16 { close $f; exit }
