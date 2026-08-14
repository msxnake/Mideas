# Second half of the dark-bat check: the travelling lantern.
#
# Bat 2 patrols at player height. Parked at the right wall, the player's own halo
# (half width 40) does not reach it once it wanders left, but a fired bullet
# drags a 16x12 lantern with it. So a bat that reads DARK must flip to LIT for
# exactly the frames the bullet passes over it, and back.
#
# Ammo is poked rather than collected: the nuts are a different feature and
# walking over them would only add noise.
#
# Usage: openmsx -machine C-BIOS_MSX2 -cart _bats.rom -romtype KonamiSCC \
#            -script bats_lantern.tcl

set out "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/_bats_lantern.txt"
set f [open $out "w"]
proc L {m} { global f; puts $f $m; flush $f }

set POOL   0xD012
set STRIDE 23
set BAT2   [expr {$POOL + 2 * $STRIDE}]
set NUTS   0xD00C
set BL_ON  0xD0A8
set BL_X   0xD0A9
set LIGHT_X 0xD074

proc rb {a} { debug read memory $a }
proc vb {a} { debug read {VRAM} $a }

# Walk right to the wall, then left for a moment so the player faces left.
after time 6  { keymatrixdown 8 0x80 }
after time 10 { keymatrixup 8 0x80 }
after time 11 { keymatrixdown 8 0x10 }
after time 11.3 { keymatrixup 8 0x10 }

set frames 0
proc watch {} {
    global frames BAT2 BL_ON BL_X LIGHT_X
    incr frames
    set body [format %02X [vb 0xF460]]
    set eye [format %02X [vb 0xF466]]
    set state [expr {$body eq "00" ? "DARK" : "LIT "}]
    L [format "f%03d bat2_x=%3d halo_x=%3d lantern=%d at %3d  body=%s eye=%s -> %s" \
        $frames [rb $BAT2] [rb $LIGHT_X] [rb $BL_ON] [rb $BL_X] $body $eye $state]
    if {$frames < 90} { after frame watch } else { global f; close $f; exit }
}

after time 12 {
    debug write memory $NUTS 9        ; # ammo, so the shot actually leaves
    L "ammo poked to 9; firing"
    keymatrixdown 4 0x08
    after time 0.2 { keymatrixup 4 0x08 }
    watch
}
