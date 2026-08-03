set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/dual141_probe4.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} { global result_path lines
    set fh [open $result_path w]; foreach l $lines { puts $fh $l }; close $fh; exit }
catch { set renderer none }
catch { set throttle off }
proc rd {addr} { return [debug read memory $addr] }
after time 8.0 { keymatrixdown 8 1 }
after time 9.0 { keymatrixup 8 1 }
foreach {name addr} {
    step_comp 0x5C27 dialogue 0x6CF2 player_mv 0x5DE1 deadly 0x6255
    hud0 0x6345 keydoors 0x656D gems 0x697F jumpers 0x6A95
    walljmp 0x6BE2 enemies 0x7311 enemy_touch 0x76AF turrets 0x7ADF
    music_upd 0x4C3D
} { set ::hits($name) 0 }
after time 11.0 {
    foreach {name addr} {
        step_comp 0x5C27 dialogue 0x6CF2 player_mv 0x5DE1 deadly 0x6255
        hud0 0x6345 keydoors 0x656D gems 0x697F jumpers 0x6A95
        walljmp 0x6BE2 enemies 0x7311 enemy_touch 0x76AF turrets 0x7ADF
        music_upd 0x4C3D
    } { debug set_bp $addr {} "incr ::hits($name)" }
}
after time 13.0 {
    foreach n {step_comp dialogue player_mv deadly hud0 keydoors gems jumpers walljmp enemies enemy_touch turrets music_upd} {
        L "$n=$::hits($n)"
    }
    flush_report
}
after time 60 { L guard; flush_report }
