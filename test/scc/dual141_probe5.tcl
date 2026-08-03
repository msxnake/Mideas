set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/dual141_probe5.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} { global result_path lines
    set fh [open $result_path w]; foreach l $lines { puts $fh $l }; close $fh; exit }
catch { set renderer none }
catch { set throttle off }
proc rd {addr} { return [debug read memory $addr] }
after time 8.0 { keymatrixdown 8 1 }
after time 9.0 { keymatrixup 8 1 }
foreach n {wipe framewait waitframes endwait gfnode3 mainloop} { set ::h($n) 0 }
after time 11.0 {
    debug set_bp 0x5927 {} { incr ::h(wipe) }
    debug set_bp 0x58DD {} { incr ::h(framewait) }
    debug set_bp 0x58EC {} { incr ::h(waitframes) }
    debug set_bp 0x8029 {} { incr ::h(endwait) }
}
after time 13.0 {
    L "hits 2s: wipe=$::h(wipe) framewait=$::h(framewait) waitframes=$::h(waitframes) endwait=$::h(endwait)"
    L "pc=[format %04X [reg pc]] pc2=[format %04X [reg pc]]"
    after time 0.1 { L "pc3=[format %04X [reg pc]]" }
    after time 0.2 { L "pc4=[format %04X [reg pc]]"; flush_report }
}
after time 60 { L guard; flush_report }
