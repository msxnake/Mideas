# Per-phase path switching: forcing boss_hp down must swap the active path
# (default rect at full HP -> "dash" at 66% -> stand still at 33%).
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_path_phase.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
proc sample {tag} {
    logline [format "%s hp=%d path=%d x=%d y=%d" \
        $tag [mem8 0xC17D] [mem8 0xC1BD] [mem8 0xC177] [mem8 0xC178]]
}
after time 6  { keymatrixdown 8 0x01 }
after time 7  { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 9  { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 11 { keymatrixup 8 0x01 }
after time 13 { sample "full_hp" }
after time 14 { debug write memory 0xC17D 2 }
after time 15 { sample "hp2    " }
after time 16 { sample "hp2    " }
after time 17 { debug write memory 0xC17D 1 }
after time 18 { sample "hp1    " }
after time 19 { sample "hp1    " }
after time 20 { sample "hp1    "; after time 1 { exit } }
