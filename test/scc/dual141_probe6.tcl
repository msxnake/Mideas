set result_path "C:/Users/salam/Documents/Programacion/Mideas/test/scc/dual141_probe6.txt"
set lines [list]
proc L {s} { global lines; lappend lines $s }
proc flush_report {} { global result_path lines
    set fh [open $result_path w]; foreach l $lines { puts $fh $l }; close $fh; exit }
catch { set renderer none }
catch { set throttle off }
proc rd {addr} { return [debug read memory $addr] }
after time 8.0 { keymatrixdown 8 1 }
after time 9.0 { keymatrixup 8 1 }
foreach n {entry n0 n5 n1 n2 n3 n4 game mupd} { set ::h($n) 0 }
after time 9.5 {
    debug set_bp 0x4037 {} { incr ::h(entry) }
    debug set_bp 0x403A {} { incr ::h(n0) }
    debug set_bp 0x403D {} { incr ::h(n5) }
    debug set_bp 0x4047 {} { incr ::h(n1) }
    debug set_bp 0x404A {} { incr ::h(n2) }
    debug set_bp 0x4050 {} { incr ::h(n3) }
    debug set_bp 0x41AA {} { incr ::h(n4) }
    debug set_bp 0x41BD {} { incr ::h(game) }
    debug set_bp 0x4C3D {} { incr ::h(mupd) }
}
after time 17.5 {
    L "hits 9.5-17.5: entry=$::h(entry) n0(start)=$::h(n0) n5(music)=$::h(n5) n1(pres)=$::h(n1) n2(wipe)=$::h(n2) n3(worldlink)=$::h(n3) n4(end)=$::h(n4) enter_game=$::h(game) music_update=$::h(mupd)"
    L "music_active=[rd 0xC400] over=[rd 0xC1F8] px=[rd 0xC001] py=[rd 0xC000]"
    flush_report
}
after time 60 { L guard; flush_report }
