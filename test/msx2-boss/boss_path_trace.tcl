# Traces the boss along its authored path: x/y must walk the rectangle
# 64,32 -> 128,32 -> 128,64 -> 64,64 and loop, pausing on the wait nodes.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_path_trace.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
proc sample {tag} {
    logline [format "%s active=%d x=%d y=%d hp=%d path=%d" \
        $tag [mem8 0xC176] [mem8 0xC177] [mem8 0xC178] [mem8 0xC17D] [mem8 0xC1BD]]
}
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
after time 17 { sample "t17" }
after time 18 { sample "t18" }
after time 19 { sample "t19" }
after time 20 { sample "t20" }
after time 22 { sample "t22" }
after time 24 { sample "t24"; screenshot -prefix boss_path_ ; after time 1 { exit } }
