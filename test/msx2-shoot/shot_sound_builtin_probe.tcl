# Built-in pew: no sequencer, no RAM. The proof is on the chip itself -- firing
# must leave channel C's registers holding the values in bitmap_shoot_sfx_data:
#   R7 mixer #3B, R4 period #60, R11 envelope period #18, R10 #10 (use envelope),
#   R13 envelope shape #09.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shoot/shot_sound_builtin_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc psg {reg} { return [debug read "PSG regs" $reg] }
proc snap {tag} {
    logline [format "%s R7=%02X R4=%02X R5=%02X R10=%02X R11=%02X R13=%02X" \
        $tag [psg 7] [psg 4] [psg 5] [psg 10] [psg 11] [psg 13]]
}
set throttle off
foreach t {6 8 10} { after time $t "keymatrixdown 8 0x01" ; after time [expr {$t + 0.5}] "keymatrixup 8 0x01" }
after time 13 { snap "before fire" }
after time 14 { keymatrixdown 4 0x08 }
after time 14.2 { keymatrixup 4 0x08 }
after time 14.3 { snap "after fire " }
after time 15 { after time 1 { exit } }
