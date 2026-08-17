# Dump SCREEN 5 page 0 straight out of VRAM so the room can be diffed against
# the composition the editor authored, without any scaling in between.
#
# Page 0 = VRAM 0x00000, 128 bytes per line, 2 pixels per byte, 256 lines.
# Sprites are not in there, so what lands in the file is the room bitmap alone.

set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/t501"

proc dump_page {path} {
    set out [open $path "w"]
    for {set y 0} {$y < 256} {incr y} {
        set line ""
        set base [expr {$y * 128}]
        for {set x 0} {$x < 128} {incr x} {
            append line [format %02X [debug read VRAM [expr {$base + $x}]]]
        }
        puts $out $line
    }
    close $out
}

foreach t {3 4 5 6 7 8} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}] "keymatrixup 8 0x01"
}

after time 15 {
    dump_page "$dir/_vram_r5.txt"
    exit
}
