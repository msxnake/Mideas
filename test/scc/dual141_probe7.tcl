set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/dual141_probe7.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} { global result_path lines
    set fh [open $result_path w]; foreach l $lines { puts $fh $l }; close $fh; exit }
catch { set renderer none }
catch { set throttle off }
proc rd {addr} { return [debug read memory $addr] }
after time 8.0 { keymatrixdown 8 1 }
after time 9.0 { keymatrixup 8 1 }
proc snap {t} {
    L "t=$t pc=[format %04X [reg pc]] sp=[format %04X [reg sp]] stack=[format %04X [expr {[rd [expr {[reg sp]+1}]]*256+[rd [reg sp]]}]],[format %04X [expr {[rd [expr {[reg sp]+3}]]*256+[rd [expr {[reg sp]+2}]]}]],[format %04X [expr {[rd [expr {[reg sp]+5}]]*256+[rd [expr {[reg sp]+4}]]}]]"
}
after time 16.0 { snap 16.0 }
after time 16.4 { snap 16.4 }
after time 16.8 { snap 16.8 }
after time 17.2 { snap 17.2; flush_report }
after time 60 { L guard; flush_report }
