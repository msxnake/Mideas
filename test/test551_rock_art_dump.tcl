# Dump the 16x16 atlas cell the falling rock is copied from, as a colour-index
# map, straight out of VRAM.
#
# WHY: whether #98 (LMMM+TIMP) is a visible regression or a no-op depends
# entirely on how many pixels of THIS art are colour 0 and where they are. TIMP
# skips colour-0 source pixels; over a black backdrop that is invisible, over
# painted art it is a hole. Reading the source cell settles it without staging
# a scenario.
#
# The rock block observed on hardware: SX=16 SY=544 NX=16 NY=16.
# SCREEN 5 VRAM address = y * 128 + x / 2, two 4-bit pixels per byte.

set OUTDIR "C:/Users/salam/AppData/Local/Temp/mideas-test551"
set LOG [open "$OUTDIR/test551-rock-art.log" w]
proc say {msg} { global LOG; puts $LOG $msg; flush $LOG }

set SX 16
set SY 544
set W  16
set H  16

after time 12.000 {
    global SX SY W H
    set zero 0
    set total 0
    set hist [dict create]
    say [format "source cell SX=%d SY=%d %dx%d  (VRAM base 0x%X)" $SX $SY $W $H [expr {$SY * 128 + $SX / 2}]]
    say "colour index per pixel, '.' = index 0 (transparent under TIMP):"
    for {set row 0} {$row < $H} {incr row} {
        set line ""
        for {set col 0} {$col < $W} {incr col} {
            set addr [expr {($SY + $row) * 128 + ($SX + $col) / 2}]
            set byte [debug read VRAM $addr]
            if {($col % 2) == 0} { set px [expr {($byte >> 4) & 0x0F} ] } else { set px [expr {$byte & 0x0F}] }
            incr total
            if {$px == 0} { incr zero ; append line "." } else { append line [format "%X" $px] }
            if {[dict exists $hist $px]} {
                dict set hist $px [expr {[dict get $hist $px] + 1}]
            } else {
                dict set hist $px 1
            }
        }
        say "  $line"
    }
    say ""
    say [format "colour 0 pixels: %d of %d (%.1f%%)" $zero $total [expr {100.0 * $zero / $total}]]
    foreach k [lsort -integer [dict keys $hist]] {
        say [format "  index %2d : %d px" $k [dict get $hist $k]]
    }
    close $LOG
    after time 0.300 { exit }
}
