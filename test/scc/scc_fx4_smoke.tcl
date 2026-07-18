# Fase 4 smoke: noise (waveform rewritten per frame) + morphing (square->triangle).
# ch2 = SCC wave idx 1 -> #9820; ch4 = idx 3 -> #9860 (shared ch4/5 RAM).
# Bank poke: #9000 <- 0x3F exposes the SCC; restore from mapper mirror after.
set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/scc_fx4_result.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} { global result_path lines
    set fh [open $result_path w]; foreach l $lines { puts $fh $l }; close $fh; exit }
catch { set renderer none }
catch { set throttle off }
proc grab {base count} {
    set saved [debug read memory 0xC118]
    debug write memory 0x9000 0x3F
    set out [list]
    for {set i 0} {$i < $count} {incr i} { lappend out [format %02X [debug read memory [expr {$base + $i}]]] }
    debug write memory 0x9000 $saved
    return $out
}
after time 8.00 {
    set ::m1 [grab 0x9820 8]
    set ::n1 [grab 0x9860 8]
}
after time 8.05 {
    set ::n2 [grab 0x9860 8]
}
after time 8.30 {
    set ::m2 [grab 0x9820 8]
    L "active=[debug read memory 0xC040] (expect 1)"
    L "morph_chan=[debug read memory 0xC0D0] (0xFF idle or 1 while morphing ch2)"
    L "wave_ch2_a=$::m1"
    L "wave_ch2_b=$::m2"
    L "noise_a=$::n1"
    L "noise_b=$::n2"
    L [expr {$::m1 ne $::m2 ? "MORPH_PASS: ch2 waveform evolves" : "MORPH_FAIL: ch2 waveform static"}]
    L [expr {$::n1 ne $::n2 ? "NOISE_PASS: ch4 waveform rewritten" : "NOISE_FAIL: ch4 waveform static"}]
    set square 1
    foreach v $::m1 { if {$v ne "70" && $v ne "90"} { set square 0; break } }
    L [expr {$square == 0 ? "MORPH_SHAPE_PASS: not a pure square" : "MORPH_SHAPE_WARN: still pure square at t=8"}]
    flush_report
}
