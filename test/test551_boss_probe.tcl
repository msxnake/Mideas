set shot "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551-current.png"
set cell_hits 0
set launch_hits 0

proc boss_cell_bp {} {
    global cell_hits
    incr cell_hits
    if {$cell_hits <= 4} {
        puts [format "BOSS_CELL hit=%d B=%02X C=%02X HL=%04X" $cell_hits [reg B] [reg C] [reg HL]]
    }
    debug cont
}

proc boss_launch_bp {} {
    global launch_hits
    incr launch_hits
    if {$launch_hits <= 12} {
        set buf 0xD2D2
        puts [format "BOSS_LAUNCH hit=%d B=%02X C=%02X cmd=%02X%02X/%02X%02X -> %02X%02X/%02X%02X NX=%02X%02X NY=%02X%02X" \
            $launch_hits [reg B] [reg C] \
            [debug read memory [expr {$buf+1}]] [debug read memory $buf] \
            [debug read memory [expr {$buf+3}]] [debug read memory [expr {$buf+2}]] \
            [debug read memory [expr {$buf+5}]] [debug read memory [expr {$buf+4}]] \
            [debug read memory [expr {$buf+7}]] [debug read memory [expr {$buf+6}]] \
            [debug read memory [expr {$buf+9}]] [debug read memory [expr {$buf+8}]] \
            [debug read memory [expr {$buf+11}]] [debug read memory [expr {$buf+10}]]]
    }
    debug cont
}

after time 4.000 {
    debug set_bp 0x98CD {} { boss_cell_bp }
    debug set_bp 0x982E {} { boss_launch_bp }
    debug cont
}

after time 8.000 {
    puts [format "STATE screen=%02X active=%02X x=%02X y=%02X shown=%02X frame=%02X page=%02X cells=%d launches=%d" \
        [debug read memory 0xC00B] [debug read memory 0xD2C5] \
        [debug read memory 0xD2C6] [debug read memory 0xD2C7] \
        [debug read memory 0xD34C] [debug read memory 0xD2CE] \
        [debug read memory 0xC0D0] $cell_hits $launch_hits]
    screenshot $shot
    after time 0.200 { exit }
}
