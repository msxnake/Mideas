# SCC VGM stream player smoke (real Konami SCC music through the Mideas driver).
# Run:
#   "C:/Program Files/openMSX/openmsx.exe" -machine C-BIOS_MSX2+ \
#     -cart test/scc/scc_vgm_play.rom -romtype KonamiSCC -script test/scc/scc_vgm_smoke.tcl
# Track 02 lasts ~5.9s, so by t=20s emutime the stream must have wrapped at
# least once (loop_count >= 1) with no bad tokens and the CPU alive.
set result_path "test/scc/scc_vgm_result.txt"
set fh_lines [list]
proc log_line {line} { global fh_lines; lappend fh_lines $line }
proc flush_report {} {
    global result_path fh_lines
    set fh [open $result_path w]
    foreach l $fh_lines { puts $fh $l }
    close $fh
    after time 1 { exit }
}
catch { set renderer none }
catch { set throttle off }

after time 8 {
    log_line "boot=[debug read memory 0xC000] (expect 1)"
    log_line "slot=[debug read memory 0xC001] (expect 2)"
    log_line "scc_init=[debug read memory 0xC002] (expect 3)"
    log_line "ready=[debug read memory 0xC005] (expect 5)"
    log_line "bad_token=[debug read memory 0xC00A] (expect 0)"
    set ::frames_a [debug read memory 0xC006]
    log_line "frames_a=$::frames_a"
    set w {}
    foreach off {0 1 2 3 4 5 6 7} {
        lappend w [format %02X [debug read memory [expr {0x9800 + $off}]]]
    }
    log_line "scc_wave_ch1_first8=$w (expect real waveform data, not FF/00 fill)"
    log_line "mixer_shadow_loops=[debug read memory 0xC009]"
}
after time 20 {
    log_line "loop_count=[debug read memory 0xC009] (expect >=1: ~5.9s track wrapped)"
    log_line "bad_token_end=[debug read memory 0xC00A] (expect 0)"
    set fb [debug read memory 0xC006]
    log_line "frames_b=$fb (expect != frames_a: main loop alive)"
}
after time 21 { debug write memory 0xC010 1 }
after time 22 {
    log_line "stopped=[debug read memory 0xC008] (expect 1)"
    flush_report
}
