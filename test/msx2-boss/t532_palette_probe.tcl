# Is the red cavern a PALETTE problem or a PIXEL INDEX problem?
#
# Dark mode is a paired 8x2 palette: 0..7 bright, 8..15 their dimmed twins, and
# the dimming is "set bit 3 of every pixel". Two ways that shows up as one flat
# colour, and they need different fixes:
#   - palette wrong  -> the 16 registers do not hold the authored colours
#   - indices wrong  -> the registers are fine but the pixels carry bad nibbles
# So dump both: all 16 entries, and a strip of the room's background pixels.
set out "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/out/t532_palette.txt"
set f [open $out "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

proc dump_palette {tag} {
    set line ""
    for {set i 0} {$i < 16} {incr i} {
        # Two bytes per entry: RB then G (each nibble 0..7).
        set b0 [debug read "VDP palette" [expr {$i * 2}]]
        set b1 [debug read "VDP palette" [expr {$i * 2 + 1}]]
        set r [expr {($b0 >> 4) & 7}]
        set b [expr {$b0 & 7}]
        set g [expr {$b1 & 7}]
        append line [format "%d:(%d,%d,%d) " $i $r $g $b]
    }
    logline "PALETTE $tag $line"
}

# SCREEN 5: 128 bytes per line, two 4-bit pixels per byte, page 0 at VRAM 0.
proc dump_pixels {tag y} {
    set line ""
    for {set i 0} {$i < 16} {incr i} {
        set addr [expr {$y * 128 + 40 + $i}]
        append line [format "%02X " [debug read "VRAM" $addr]]
    }
    logline "PIXELS $tag y=$y $line"
}

for {set t 4} {$t < 16} {incr t} {
    after time $t                "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}

after time 18 {
    logline "room=[debug read memory 0xC00B]"
    dump_palette "in-room"
    dump_pixels "bg-upper" 60
    dump_pixels "bg-mid" 120
    screenshot -prefix t532_pal_
    logline "done"
    after time 1 { exit }
}
