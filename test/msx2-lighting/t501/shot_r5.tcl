# Boot straight into "caverna1 Este Norte Norte Norte Norte" (room index 5,
# lighting = off) and photograph it, with the lighting state alongside.
#
# Usage: openmsx -machine C-BIOS_MSX2 -cart _r5.rom -romtype KonamiSCC \
#            -script shot_r5.tcl

set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/t501"
set f [open "$dir/_shot_r5.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }

proc state {tag} {
    L "$tag screen=[debug read memory 0xC00B] page=[debug read memory 0xC0D0]\
 player=[debug read memory 0xC001],[debug read memory 0xC000]\
 light_active=[debug read memory 0xD08E]\
 plat_count=[debug read memory 0xD070]\
 plat_light=[debug read memory 0xD087],[debug read memory 0xD088]\
 flags=[debug read memory 0x85F2],[debug read memory 0x85F3],[debug read memory 0x85F4],[debug read memory 0x85F5],[debug read memory 0x85F6],[debug read memory 0x85F7],[debug read memory 0x85F8]"
}

foreach t {3 4 5 6 7 8} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}] "keymatrixup 8 0x01"
}

foreach t {10 14 18} {
    after time $t "state t$t; screenshot $dir/_shot_r5_t$t.png"
}

after time 20 {
    state final
    close $f
    exit
}
