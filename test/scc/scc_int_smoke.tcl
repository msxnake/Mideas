set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/scc_int_result.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} { global result_path lines
    set fh [open $result_path w]; foreach l $lines { puts $fh $l }; close $fh; exit }
catch { set renderer none }
catch { set throttle off }
set ::s1 [list]
proc sample {} { lappend ::s1 [debug read memory 0xC086] }
proc distinct {lst} { set d [dict create]; foreach v $lst { dict set d $v 1 }; return [dict size $d] }
after time 8.00 { sample }
after time 8.03 { sample }
after time 8.06 { sample }
after time 8.09 { sample }
after time 8.12 { sample }
after time 8.15 { sample }
after time 8.18 { sample }
after time 8.21 { sample }
after time 8.24 { sample }
after time 8.30 {
    L "active=[debug read memory 0xC010] (expect 1)"
    L "mixer=[debug read memory 0xC026] (expect nonzero)"
    L "period1_samples=$::s1"
    L "distinct=[distinct $::s1] (expect >=2)"
    flush_report
}
