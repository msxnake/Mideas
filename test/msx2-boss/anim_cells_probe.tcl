# FASE 3 in hardware: does the metatile body actually render?
#
# The generator is byte-correct (tables verified) and the ROM assembles, but the
# thing that matters is whether 16 separate HMMMs land where one used to: a
# wrong offset shows up as a seam, a wrong SY as garbage from the visible page.
#
# Also samples boss_cells_shown, the byte that picks full vs changed-cell
# repaint. It starts at #FF (nothing drawn) and then tracks the animation frame.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/out/anim_cells_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }

proc sample {tag} {
    logline [format "%s screen=%d active=%d x=%d y=%d hp=%d frame=%d shown=%d" \
        $tag [mem8 0xC00B] [mem8 0xD16D] [mem8 0xD16E] [mem8 0xD16F] \
        [mem8 0xD174] [mem8 0xD176] [mem8 0xD1D1]]
}

# The project opens on a presentation screen: tap SPACE until the game starts.
for {set t 4} {$t < 16} {incr t} {
    after time $t             "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}

after time 17 { sample "start" ; screenshot -prefix anim_cells_start_ }

# Then walk right to reach the boss room.
for {set t 18} {$t < 34} {incr t} {
    after time $t             "keymatrixdown 8 0x80"
    after time [expr {$t + 0.7}] "keymatrixup 8 0x80"
}

after time 26 { sample "walk26" ; screenshot -prefix anim_cells_walk_ }
after time 35 { sample "t35" ; screenshot -prefix anim_cells_a_ }
after time 37 { sample "t37" }
after time 39 {
    sample "t39"
    screenshot -prefix anim_cells_b_
    logline "done"
    after time 1 { exit }
}
