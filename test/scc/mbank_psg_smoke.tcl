# Multi-bank music smoke for test139_mbank_psg.rom (music data split across TWO
# 8KB MegaROM banks; the Music node plays the DUAL track whose data lives in
# music bank chunk 1 = physical bank 16, i.e. the NEW bank-switch path).
# Launch:
#   "C:/Program Files/openMSX/openmsx.exe" -machine C-BIOS_MSX2+ \
#     -carta out/test139_mbank_psg.rom -romtype KonamiSCC -script ../mbank_smoke.tcl
# RAM map (test139_mbank.sym):
#   music_active          #C400   music_track_index #C403
#   scc_music_active      #C404   scc_music_pattern_row #C40C
#   music_data_bank_cur   #C4DC   psg_music_active  #C4DD
#   psg_music_pattern_row #C4E5
set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/mbank_psg_result.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} { global result_path lines
    set fh [open $result_path w]; foreach l $lines { puts $fh $l }; close $fh; exit }
catch { set renderer none }
catch { set throttle off }

proc rd {addr} { return [debug read memory $addr] }
proc psg_reg {r} { return [debug read "PSG regs" $r] }

# Boot intro waits for SPACE before the Music node runs.
after time 8.0 { keymatrixdown 8 1 }
after time 9.0 { keymatrixup 8 1 }

after time 12.0 {
    L "=== t=12 music state ==="
    L "music_active=[rd 0xC400] track_index=[rd 0xC403] data_bank_cur=[rd 0xC4DC]"
    L "scc_active=[rd 0xC404] psg_active=[rd 0xC4DD]"
    L "scc_row=[rd 0xC40C] psg_row=[rd 0xC4E5]"
    L "AY: R0=[psg_reg 0] R1=[psg_reg 1] R7=[format %02X [psg_reg 7]] R8=[psg_reg 8]"
    set ::snap_scc_row [rd 0xC40C]
    set ::snap_psg_row [rd 0xC4E5]
}

after time 16.0 {
    L "=== t=16 progress ==="
    set bank [rd 0xC4DC]
    set scc_row [rd 0xC40C]
    set psg_row [rd 0xC4E5]
    L "music_active=[rd 0xC400] track_index=[rd 0xC403] data_bank_cur=$bank"
    L "scc_active=[rd 0xC404] psg_active=[rd 0xC4DD]"
    L "scc_row=$scc_row psg_row=$psg_row"
    L "AY: R0=[psg_reg 0] R1=[psg_reg 1] R7=[format %02X [psg_reg 7]] R8=[psg_reg 8]"
    set verdict "FAIL"
    # Dual track = combined index 1, data in music bank 16 (chunk 1): both
    # chip halves must be active and their row counters advancing.
    if {[rd 0xC400] == 1 && [rd 0xC4DD] == 1 && $bank == 16 \
        && $psg_row != $::snap_psg_row} { set verdict "OK" }
    L "rows_moved=[expr {$scc_row != $::snap_scc_row || $psg_row != $::snap_psg_row}] verdict=$verdict"
    flush_report
}

after time 120 {
    L "=== guard timeout, boot never settled ==="
    flush_report
}
