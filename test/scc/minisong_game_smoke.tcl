# Full-game smoke: SCREEN 5 bitmap MegaROM + GameFlow Music node (Fase 5).
# Taps SPACE through the intro scenes, then verifies in gameplay: music
# active, mixer live, period modulated, and the player still moves (RIGHT).
set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/minisong_game_result.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} { global result_path lines
    set fh [open $result_path w]; foreach l $lines { puts $fh $l }; close $fh; exit }
catch { set renderer none }
catch { set throttle off }
proc tap_space {} { keymatrixdown 8 0x01; after time 0.2 { keymatrixup 8 0x01 } }
after time 6 { tap_space }
after time 7 { tap_space }
after time 8 { tap_space }
after time 9 { tap_space }
after time 10 { tap_space }
set ::p [list]
proc samp {} { lappend ::p [debug read memory 0xC47A] }
after time 12.00 { samp }
after time 12.05 { samp }
after time 12.10 { samp }
after time 12.15 { samp }
after time 12.20 { samp }
after time 12.25 { samp }
proc distinct {lst} { set d [dict create]; foreach v $lst { dict set d $v 1 }; return [dict size $d] }
after time 12.3 {
    L "music_active=[debug read memory 0xC400] (expect 1)"
    L "scc_music_active=[debug read memory 0xC404] (expect 1)"
    L "mixer_shadow=[debug read memory 0xC41A] (expect nonzero)"
    L "period_ch1_samples=$::p distinct=[distinct $::p] (expect >=2)"
    set ::x0 [debug read memory 0xC001]
    L "player_x_before=$::x0"
    keymatrixdown 8 0x80
}
after time 13.3 {
    keymatrixup 8 0x80
    L "player_x_after=[debug read memory 0xC001] (expect != before: player moves with music on)"
    catch { record start C:/Users/salam/Documents/Programacion/Mideas/test/scc/minisong_game -audioonly } ::rec
    L "record=$::rec"
}
after time 19 {
    catch { record stop }
    L "t19_music_active=[debug read memory 0xC400] loop=[debug read memory 0xC406]"
    flush_report
}
