# Walk into room 5 and record what the LIGHTING readers actually see when they
# read bitmap_light_room_flags (#85F2..#85F8).
#
# The table lives inside the #8000-#9FFF window, which the room loader maps to
# ROM DATA banks while it streams a room. Any read taken while a data bank is
# still mapped returns that bank's bytes instead of the flags. ROM contents are
# known (01 01 01 01 01 00 00), so a mismatch is proof, not inference.
#
# Only PCs inside the real readers are reported; the RLE streamer legitimately
# reads those same addresses out of a data bank.

set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/t501"
set f [open "$dir/_bankprobe.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }

# From _t501.sym
set ::READERS {
    0x71C8 0x71DA bitmap_light_room_is_dark
    0x7F00 0x8196 bitmap_load_platforms
    0x8197 0x82D5 bitmap_platform_refresh_light_colors
}

proc reader_name {pc} {
    foreach {lo hi name} $::READERS {
        if {$pc >= $lo && $pc <= $hi} { return $name }
    }
    return ""
}

proc flags_now {} {
    set s ""
    for {set i 0} {$i < 7} {incr i} {
        append s [format "%02X " [debug read memory [expr {0x85F2 + $i}]]]
    }
    return [string trim $s]
}

set ::bad 0
set ::good 0

debug set_watchpoint read_mem {0x85F2 0x85F8} {} {
    set pc [reg PC]
    set name [reader_name $pc]
    if {$name ne ""} {
        set now [flags_now]
        set scr [debug read memory 0xC00B]
        if {$now ne "01 01 01 01 01 00 00"} {
            incr ::bad
            L "GARBAGE $name pc=[format %04X $pc] screen=$scr saw=[list $now]"
        } else {
            incr ::good
        }
    }
}

proc scr {} { debug read memory 0xC00B }

foreach t {3 4 5 6 7 8} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.2}] "keymatrixup 8 0x01"
}

set ::done 0
proc nudge {} {
    if {$::done} return
    switch -- [scr] {
        0 { keymatrixdown 8 0x80; debug write memory 0xC001 239 }
        1 { keymatrixup 8 0x80; debug write memory 0xC000 0xFE }
        2 { debug write memory 0xC000 0xFE }
        3 { debug write memory 0xC000 0xFE }
        4 { debug write memory 0xC000 0xFE }
        5 {
            set ::done 1
            L "--- arrived in room 5 ---"
            after time 6 {
                L ""
                L "clean reads=$::good   GARBAGE reads=$::bad"
                L "screen=[scr] light_active=[debug read memory 0xD08E]\
 plat_light=[debug read memory 0xD087],[debug read memory 0xD088]"
                close $::f
                exit
            }
            return
        }
    }
    after time 0.05 nudge
}
set ::f $f
after time 10 nudge

after time 90 {
    L "TIMEOUT screen=[scr] good=$::good bad=$::bad"
    close $f
    exit
}
