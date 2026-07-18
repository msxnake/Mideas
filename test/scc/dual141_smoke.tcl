# Dual PSG+SCC smoke for test141_dual.rom (Fase 3).
# Launch:
#   "C:/Program Files/openMSX/openmsx.exe" -machine C-BIOS_MSX2+ \
#     -carta out/test141_dual.rom -romtype KonamiSCC -script dual141_smoke.tcl
# Proves BOTH halves of 'la_nova' play: player RAM advances and the real AY
# registers (periods/volumes/mixer) move over time.
set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/dual141_result.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} { global result_path lines
    set fh [open $result_path w]; foreach l $lines { puts $fh $l }; close $fh; exit }
catch { set renderer none }
catch { set throttle off }

proc rd {addr} { return [debug read memory $addr] }
proc psg_reg {r} { return [debug read "PSG regs" $r] }

set ::ay_samples [list]
proc sample_ay {} {
    lappend ::ay_samples "R0=[psg_reg 0] R8=[psg_reg 8] R9=[psg_reg 9] R10=[psg_reg 10] R7=[format %02X [psg_reg 7]]"
}

# The project boots into a Screen5Presentation intro that waits for SPACE
# (run_bitmap_intro), and the Music node only plays after it. Press SPACE.
after time 8.0 { keymatrixdown 8 1 }
after time 9.0 { keymatrixup 8 1 }

after time 12.0 {
    L "=== t=12 music state ==="
    L "music_active=[rd 0xC400] scc_active=[rd 0xC404] psg_active=[rd 0xC4DC]"
    L "psg_notes=[rd 0xC4EF],[rd 0xC4F0],[rd 0xC4F1] psg_volout=[rd 0xC50A],[rd 0xC50B],[rd 0xC50C]"
    L "psg_row=[rd 0xC4E4]/[rd 0xC4E5] scc_order=[rd 0xC409] psg_order=[rd 0xC4E1]"
    L "AY: R0=[psg_reg 0] R1=[psg_reg 1] R7=[format %02X [psg_reg 7]] R8=[psg_reg 8] R9=[psg_reg 9] R10=[psg_reg 10]"
    set ::snap1_row [rd 0xC4E4]
}
after time 12.3 { sample_ay }
after time 12.6 { sample_ay }
after time 12.9 { sample_ay }
after time 13.2 { sample_ay }
after time 13.5 { sample_ay }
after time 13.8 { sample_ay }
after time 14.1 { sample_ay }
after time 14.4 { sample_ay }

after time 16.0 {
    L "=== t=16 progress ==="
    L "music_active=[rd 0xC400] scc_active=[rd 0xC404] psg_active=[rd 0xC4DC]"
    L "psg_notes=[rd 0xC4EF],[rd 0xC4F0],[rd 0xC4F1] psg_volout=[rd 0xC50A],[rd 0xC50B],[rd 0xC50C]"
    L "psg_row=[rd 0xC4E4] scc_order=[rd 0xC409] psg_order=[rd 0xC4E1]"
    set row2 [rd 0xC4E4]
    set verdict "FAIL"
    if {[rd 0xC4DC] == 1 && [rd 0xC404] == 1 && $row2 != $::snap1_row} { set verdict "OK" }
    L "row_moved=[expr {$row2 != $::snap1_row}] verdict=$verdict"
    L "AY samples:"
    foreach s $::ay_samples { L "  $s" }
    flush_report
}

after time 120 {
    L "=== guard timeout, boot never settled ==="
    flush_report
}
