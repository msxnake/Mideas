# Dark-room bats: does the body really hide, and does light really bring it back?
#
# Reads the three enemy line-colour blocks straight out of VRAM (#F440/#F450/
# #F460) every so often. Byte 6 is the eye row and byte 0 is a body row, so:
#   body=00 eye=07  -> dark, only the eyes are drawn
#   body=02 eye=07  -> lit, the whole bat is drawn
# Also logs the halo centre so a lit bat can be checked against its distance.
#
# Usage: openmsx -machine C-BIOS_MSX2 -cart _bats.rom -romtype KonamiSCC \
#            -script bats_dark.tcl

set out "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/_bats_dark.txt"
set f [open $out "w"]
proc L {m} { global f; puts $f $m; flush $f }

set POOL   0xD012
set STRIDE 23
set LIGHT_X 0xD074
set LIGHT_Y 0xD075
set LIGHT_ON 0xD088
set LIGHT_ACTIVE 0xD078
set SCREEN 0xC00B
set PLAYER_X 0xC001
set PLAYER_Y 0xC000

proc rb {a} { debug read memory $a }
proc vb {a} { debug read {VRAM} $a }

proc report {tag} {
    global POOL STRIDE LIGHT_X LIGHT_Y LIGHT_ON LIGHT_ACTIVE SCREEN PLAYER_X PLAYER_Y
    set line "$tag scr=[rb $SCREEN] player=[rb $PLAYER_X],[rb $PLAYER_Y]"
    append line " halo=[rb $LIGHT_X],[rb $LIGHT_Y] on=[rb $LIGHT_ON] active=[rb $LIGHT_ACTIVE]"
    L $line
    for {set i 0} {$i < 3} {incr i} {
        set base [expr {$POOL + $i * $STRIDE}]
        set ex [rb $base]
        set ey [rb [expr {$base + 1}]]
        set cv [expr {0xF440 + $i * 16}]
        set body [format %02X [vb $cv]]
        set eye [format %02X [vb [expr {$cv + 6}]]]
        set state [expr {$body eq "00" ? "DARK" : "LIT "}]
        L "   bat$i at $ex,$ey  block: body=$body eye=$eye  -> $state"
    }
}

# Walk right for a while so the halo sweeps across the bats, then stand still.
after time 8  { keymatrixdown 8 0x80 }
after time 12 { keymatrixup 8 0x80 }

foreach t {6 9 11 13 15 17 19} {
    after time $t "report t$t"
}
after time 20 {
    report "final"
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/_bats_dark.png"
    close $f
    exit
}
