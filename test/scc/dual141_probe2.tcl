set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/dual141_probe2.txt"
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
    L "t=$t pc=[format %04X [reg pc]] sccrow=[rd 0xC40C] scccnt=[rd 0xC408] psgrow=[rd 0xC4E4] psgcnt=[rd 0xC4E0] psgmut=[rd 0xC4DE] px=[rd 0xC001] over=[rd 0xC1F8]"
}
after time 12.0 { snap 12.0 }
after time 12.5 { snap 12.5 }
after time 13.0 { snap 13.0 }
after time 13.5 { snap 13.5 }
after time 14.0 { snap 14.0; flush_report }
after time 60 { L guard; flush_report }
