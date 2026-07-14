# SCC probe smoke (docs/MIDEAS_SCC_KONAMI_STUDY.md, tests 1/5/6).
# Run:
#   "C:/Program Files/openMSX/openmsx.exe" -machine C-BIOS_MSX2+ \
#     -cart test/scc/scc_probe.rom -romtype KonamiSCC -script test/scc/scc_smoke.tcl
# Asserts (via RAM markers written by the ROM, see scc_probe.asm header):
#   boot/slot/init/ready markers, waveform readback at #9800, sequencer
#   advancing, and SCC_Stop leaving the chip silent with the CPU alive.
set result_path "test/scc/scc_result.txt"
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
    log_line "wave_ok=[debug read memory 0xC003] (expect 1)"
    log_line "wave_mismatch_idx=[debug read memory 0xC004] (only meaningful if wave_ok=0)"
    log_line "ready=[debug read memory 0xC005] (expect 5)"
    set w {}
    foreach off {0 1 2 3 4 5 6 7 8} {
        lappend w [format %02X [debug read memory [expr {0x9800 + $off}]]]
    }
    log_line "scc_wave_9800..9808=$w (expect 00 10 20 30 40 50 60 70 7F)"
    log_line "frames_a=[debug read memory 0xC006] (expect >0)"
    log_line "note_idx_a=[debug read memory 0xC007]"
}
after time 9.2 {
    log_line "note_idx_b=[debug read memory 0xC007] (expect != note_idx_a: sequencer advances)"
}
after time 10 { debug write memory 0xC010 1 }
after time 11 {
    log_line "stopped=[debug read memory 0xC008] (expect 1)"
    set ::frames_stop_a [debug read memory 0xC006]
    log_line "frames_at_stop=$::frames_stop_a"
}
after time 12 {
    log_line "frames_after_stop=[debug read memory 0xC006] (expect == frames_at_stop: loop halted)"
    flush_report
}
