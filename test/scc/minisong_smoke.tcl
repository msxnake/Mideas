# Mini-song standalone smoke + WAV capture. Markers like scc_track_smoke.
set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/minisong_result.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} { global result_path lines
    set fh [open $result_path w]; foreach l $lines { puts $fh $l }; close $fh; exit }
catch { set renderer none }
catch { set throttle off }
after time 6 {
    catch { record start C:/Users/salam/Documents/Programacion/Mideas/test/scc/minisong -audioonly } ::rec_err
    L "record_start=$::rec_err"
}
after time 8 {
    L "boot=[debug read memory 0xC000] active=[debug read memory 0xC040]"
    L "order_pos=[debug read memory 0xC045] row=[debug read memory 0xC048] rows=[debug read memory 0xC049] (expect 32)"
}
after time 20 {
    L "t20_active=[debug read memory 0xC040] loop_count=[debug read memory 0xC042] order_pos=[debug read memory 0xC045]"
    catch { record stop } ::recstop
    L "record_stop=$::recstop"
    flush_report
}
