# Samples the boss position over time so the Boss Editor movement modes can be
# checked on real hardware timing: 'static' must never move, 'patrolY' must
# travel down and bounce inside [minY, minY+range].
# Usage: openmsx -machine C-BIOS_MSX2 -cart <rom> -romtype konami -script boss_move_modes.tcl
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_move_modes.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }

proc sample {tag} {
    logline [format "%s active=%d x=%d y=%d hp=%d" \
        $tag [mem8 0xC176] [mem8 0xC177] [mem8 0xC178] [mem8 0xC17D]]
}

# Skip the title/gameflow screens into the boot room.
after time 6  { keymatrixdown 8 0x01 }
after time 7  { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 9  { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 11 { keymatrixup 8 0x01 }

after time 13 { sample "t13" }
after time 14 { sample "t14" }
after time 15 { sample "t15" }
after time 16 { sample "t16" }
after time 18 { sample "t18" }
after time 20 { sample "t20"; after time 1 { exit } }
