# Multi-world smoke: dump the VDP palette the ROM actually uploaded once the
# Game Flow reaches its first WorldLink. The fixture enters world 0 first, so
# the palette after the intro must be world 0's table, not the other world's.
#
# The graph opens with a Screen5Presentation that waits for a key, so SPACE is
# tapped repeatedly until gameplay starts.
set outdir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-worldpalette/out"
set log [open "$outdir/world_palette_probe.txt" w]

proc tap_space {} {
    keymatrixdown 8 0x01
    after time 0.15 { keymatrixup 8 0x01 }
}

proc dump_palette {tag} {
    global log
    set line "$tag palette="
    for {set i 0} {$i < 32} {incr i} {
        append line [format "%02X " [debug read "VDP palette" $i]]
    }
    puts $log $line
    # RAM addresses come from the generated equates (bitmap_world_* block).
    puts $log "$tag world_index=[format %02X [debug read memory 0xC196]] start_room=[format %02X [debug read memory 0xC197]] spawn_x=[format %02X [debug read memory 0xC198]] spawn_y=[format %02X [debug read memory 0xC199]] current_room=[format %02X [debug read memory 0xC00B]] player_x=[format %02X [debug read memory 0xC001]] player_y=[format %02X [debug read memory 0xC000]]"
    flush $log
}

for {set t 0} {$t < 12} {incr t} {
    after time [expr {5.0 + $t * 1.0}] tap_space
}
after time 10.0 { dump_palette t10 }
after time 15.0 { dump_palette t15 }
after time 20.0 {
    dump_palette t20
    screenshot -raw "$outdir/world_palette_boot.png"
    close $log
    exit
}
