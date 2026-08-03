set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/dual141_probe3.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} { global result_path lines
    set fh [open $result_path w]; foreach l $lines { puts $fh $l }; close $fh; exit }
catch { set renderer none }
catch { set throttle off }
proc rd {addr} { return [debug read memory $addr] }
after time 8.0 { keymatrixdown 8 1 }
after time 9.0 { keymatrixup 8 1 }
set ::mu_hits 0
set ::psg_hits 0
set ::loop_hits 0
after time 11.0 {
    debug set_bp 0x4C3D {} { incr ::mu_hits }
    debug set_bp 0x4998 {} { incr ::psg_hits }
    debug set_bp 0x5DD2 {} { incr ::loop_hits }
}
after time 13.0 {
    L "hits over 2s: music_update=$::mu_hits psg_music_update=$::psg_hits wait_vblank=$::loop_hits"
    L "scc_muted=[rd 0xC405] psg_muted=[rd 0xC4DD] scc_cnt=[rd 0xC408] psg_cnt=[rd 0xC4E0] music_active=[rd 0xC400]"
    flush_report
}
after time 60 { L guard; flush_report }
