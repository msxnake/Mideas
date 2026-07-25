# A sine segment must make boss_y oscillate around the segment line (y=48)
# while boss_x sweeps 48 -> 144. Sampled densely enough to see the wave.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_path_sine.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
proc sample {tag} {
    logline [format "%s x=%3d y=%3d path=%d" $tag [mem8 0xC177] [mem8 0xC178] [mem8 0xC1BD]]
}
after time 6  { keymatrixdown 8 0x01 }
after time 7  { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 9  { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 11 { keymatrixup 8 0x01 }
for {set i 0} {$i < 24} {incr i} {
    set t [expr {13.0 + $i * 0.25}]
    after time $t [list sample [format "t%05.2f" $t]]
}
after time 19.5 { after time 0.5 { exit } }
