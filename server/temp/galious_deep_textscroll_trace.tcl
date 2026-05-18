set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_deep_textscroll_trace.log"
set f [open $log_path "w"]
set active 0
set maxlog 420
set count 0

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc vram8 {addr} { return [debug read "VRAM" $addr] }

proc sum_mem {start len} {
    set s 0
    for {set i 0} {$i < $len} {incr i} {
        set s [expr {($s + ([mem8 [expr {$start + $i}]] * (($i & 15) + 1))) & 0x7FFFFFFF}]
    }
    return $s
}

proc sum_vram {start len} {
    set s 0
    for {set i 0} {$i < $len} {incr i} {
        set s [expr {($s + ([vram8 [expr {$start + $i}]] * (($i & 15) + 1))) & 0x7FFFFFFF}]
    }
    return $s
}

proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc bytes_mem {start len} {
    set out ""
    for {set i 0} {$i < $len} {incr i} {
        append out [format "%02X" [mem8 [expr {$start + $i}]]]
        if {$i != [expr {$len - 1}]} { append out " " }
    }
    return $out
}

proc bytes_vram {start len} {
    set out ""
    for {set i 0} {$i < $len} {incr i} {
        append out [format "%02X" [vram8 [expr {$start + $i}]]]
        if {$i != [expr {$len - 1}]} { append out " " }
    }
    return $out
}

proc sample {tag} {
    set pc [reg PC]
    set p0 [sum_vram 0x0000 0x0800]
    set p1 [sum_vram 0x0800 0x0800]
    set p2 [sum_vram 0x1000 0x0800]
    set c0 [sum_vram 0x2000 0x0800]
    set c1 [sum_vram 0x2800 0x0800]
    set c2 [sum_vram 0x3000 0x0800]
    set n0 [sum_vram 0x3800 0x0300]
    set e8 [sum_mem 0xE800 0x0230]
    set ed [sum_mem 0xED00 0x0300]
    logline [format "%s pc=%04X pgt=%d/%d/%d clr=%d/%d/%d nam=%d ram_e800=%d ram_ed00=%d" $tag $pc $p0 $p1 $p2 $c0 $c1 $c2 $n0 $e8 $ed]
    logline [format "%s e800=%s" $tag [bytes_mem 0xE800 24]]
    logline [format "%s color2010=%s" $tag [bytes_vram 0x2010 24]]
    logline [format "%s name3800=%s" $tag [bytes_vram 0x3800 32]]
}

proc log_bios {name} {
    global active maxlog count
    if {!$active} { debug cont; return }
    if {$count >= $maxlog} { debug cont; return }
    set sp [reg SP]
    set ret [mem16 $sp]
    set callsite [expr {($ret - 3) & 0xFFFF}]
    set hl [reg HL]
    set de [reg DE]
    set bc [reg BC]
    set af [reg AF]
    incr count
    logline [format "%03d %s ret=%04X call=%04X HL=%04X DE=%04X BC=%04X AF=%04X e800=%d ed00=%d" $count $name $ret $callsite $hl $de $bc $af [sum_mem 0xE800 0x0230] [sum_mem 0xED00 0x0300]]
    debug cont
}

debug set_bp 0x005C {} { log_bios LDIRVM }
debug set_bp 0x0056 {} { log_bios FILVRM }
debug set_bp 0x004D {} { log_bios WRTVRM }

after time 74.0 { sample "t74_pre"; set active 1; logline "ACTIVE" }
after time 76.0 { sample "t76" }
after time 78.0 { sample "t78" }
after time 80.0 { sample "t80" }
after time 80.2 { sample "t80_2" }
after time 80.4 { sample "t80_4" }
after time 80.6 { sample "t80_6" }
after time 80.8 { sample "t80_8" }
after time 81.0 { sample "t81" }
after time 82.0 { sample "t82" }
after time 84.0 { sample "t84" }
after time 86.0 { sample "t86" }
after time 88.0 { sample "t88" }
after time 90.0 { sample "t90" }
after time 92.0 { sample "t92" }
after time 94.0 { sample "t94" }
after time 96.0 { sample "t96"; logline "DONE"; close $f; exit }
