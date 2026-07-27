# Boss body from a `msx2bitmapstamp` asset.
#
# The stamp is not painted by the room, so the only thing that can put it in
# VRAM is the generator injecting it into the shared world atlas. If that works,
# the boss body rectangle at the table's (sx, sy) is NOT blank.
#
# Table bitmap_boss_room_1 says sx=#0058 sy=#0270, w=#40 h=#40. `sy` is an
# ABSOLUTE VRAM row (the atlas starts at row 512 = VRAM #10000), so the byte for
# pixel (x, y) is at y * 128 + x / 2 -- 128 bytes per SCREEN 5 row, 2 px/byte.
# Reading a few rows of that rectangle proves the pixels arrived.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/stampbody.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

# The body rectangle from bitmap_boss_room_1.
set body_sx 0x58
set body_sy 0x270
set body_w 0x40
set body_h 0x40

# The GameFlow intro runs first, so wait until the room (and its atlas upload)
# is actually up before reading VRAM.
foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 20 {
    set nonzero 0
    set total 0
    set sample {}
    # Walk the body rectangle every 8th row / 4th byte: enough to tell "the
    # picture is there" from "the packer left this area at colour 0".
    for {set row 0} {$row < $body_h} {incr row 8} {
        for {set col 0} {$col < [expr {$body_w / 2}]} {incr col 4} {
            set addr [expr {($body_sy + $row) * 128 + ($body_sx / 2) + $col}]
            set byte [debug read "physical VRAM" $addr]
            incr total
            if {$byte != 0} { incr nonzero }
            if {[llength $sample] < 8} { lappend sample [format %02X $byte] }
        }
    }
    logline "body rect at sx=$body_sx sy=$body_sy ${body_w}x${body_h}"
    logline "sampled $total bytes, $nonzero non-zero"
    logline "first bytes: $sample"
    logline "boss_active=[debug read memory 0xC176] boss_x=[debug read memory 0xC177] boss_y=[debug read memory 0xC178]"
    after time 1 { exit }
}
