# SCC effects smoke: arpeggio (ornament) + instrument vibrato.
# Run from the repo root with an ABSOLUTE result path (openMSX's CWD is the repo
# root; a repo-relative open from a test/scc CWD silently fails).
# Fixture build_scc_test_rom.mjs: ch3 uses ornament 1 [0,+4,+7]; instrument 1
# has vibrato depth=4 speed=24 delay=3. Channel index '1'->0 (vibrato only),
# '3'->2 (vibrato + arpeggio). period_lo[0..4] at C0B6.
set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/scc_fx_result.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} {
    global result_path lines
    set fh [open $result_path w]
    foreach l $lines { puts $fh $l }
    close $fh
    exit
}
catch { set renderer none }
catch { set throttle off }
set ::s0 [list]
set ::s2 [list]
proc sample {} {
    lappend ::s0 [debug read memory 0xC0B6]
    lappend ::s2 [debug read memory 0xC0B8]
}
proc distinct {lst} {
    set seen [dict create]
    foreach v $lst { dict set seen $v 1 }
    return [dict size $seen]
}
after time 8.00 { sample }
after time 8.02 { sample }
after time 8.04 { sample }
after time 8.06 { sample }
after time 8.08 { sample }
after time 8.10 { sample }
after time 8.12 { sample }
after time 8.14 { sample }
after time 8.16 { sample }
after time 8.18 { sample }
after time 8.20 { sample }
after time 8.22 { sample }
after time 8.24 { sample }
after time 8.26 { sample }
after time 8.28 { sample }
after time 8.30 { sample }
after time 8.32 { sample }
after time 8.34 { sample }
after time 8.40 {
    L "active=[debug read memory 0xC040] (expect 1)"
    L "mixer=[debug read memory 0xC056] (expect nonzero)"
    L "note0=[debug read memory 0xC057] note2=[debug read memory 0xC059]"
    L "samples_ch0=$::s0"
    L "samples_ch2=$::s2"
    L "distinct_ch0_vibrato=[distinct $::s0] (expect >=3: vibrato oscillates)"
    L "distinct_ch2_arp=[distinct $::s2] (expect >=3: arpeggio steps root/+4/+7)"
    flush_report
}
