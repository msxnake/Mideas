set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/dual141_probe.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} { global result_path lines
    set fh [open $result_path w]; foreach l $lines { puts $fh $l }; close $fh; exit }
catch { set renderer none }
catch { set throttle off }
proc rd {addr} { return [debug read memory $addr] }

proc snap {t} {
    L "t=$t pc=[format %04X [reg pc]] rom4000=[format %02X [rd 0x4000]],[format %02X [rd 0x4001]] p2mirror=[rd 0xC3FF] music_active=[rd 0xC400] scc_active=[rd 0xC404] psg_active=[rd 0xC4DC]"
}
after time 2  { snap 2 }
after time 4  { snap 4 }
after time 6  { snap 6 }
after time 8  { snap 8 }
after time 10 { snap 10 }
after time 12 { snap 12 }
after time 14 { snap 14; flush_report }
after time 60 { L "guard"; flush_report }
