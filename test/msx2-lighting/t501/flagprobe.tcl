# Does bitmap_light_room_flags (#85F2) ever get read with a DATA bank mapped
# into the P2 #8000-#9FFF window?
#
# The table is 7 bytes and its ROM contents are known: 1,1,1,1,1,0,0.
# The watchpoint callback re-reads it through the CURRENT mapping, so any hit
# that does not report "01 01 01 01 01 00 00" proves the reader saw garbage.
#
# Usage: openmsx -machine C-BIOS_MSX2 -cart _t501.rom -romtype KonamiSCC \
#            -script flagprobe.tcl

set out "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/t501/_flagprobe.txt"
set f [open $out "w"]
proc L {m} { global f; puts $f $m; flush $f }

set ::hits 0
set ::bad 0

proc dump_flags {} {
    set s ""
    for {set i 0} {$i < 7} {incr i} {
        append s [format "%02X " [debug read memory [expr {0x85F2 + $i}]]]
    }
    return [string trim $s]
}

debug set_watchpoint read_mem {0x85F2 0x85F8} {} {
    incr ::hits
    set pc [format %04X [reg PC]]
    set now [dump_flags]
    set scr [debug read memory 0xC00B]
    if {$now ne "01 01 01 01 01 00 00"} {
        incr ::bad
        L "BAD  hit=$::hits pc=$pc screen=$scr table=[list $now]"
    } elseif {$::hits < 25 || $::hits % 200 == 0} {
        L "ok   hit=$::hits pc=$pc screen=$scr table=[list $now]"
    }
}

# Nudge past the intro / any menu.
foreach t {3 4 5 6 7 8} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}] "keymatrixup 8 0x01"
}

after time 25 {
    L ""
    L "total hits=$::hits  bad=$::bad"
    L "screen=[debug read memory 0xC00B] light_active=[debug read memory 0xD08E]"
    screenshot "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/t501/_flagprobe.png"
    close $f
    exit
}
