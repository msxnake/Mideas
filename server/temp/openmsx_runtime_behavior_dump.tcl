set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_runtime_behavior_dump.log" w]
puts $f "script_started"
flush $f

reset
after 1000
carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic165_unified.rom"
puts $f "rom_loaded"
flush $f

after 8000

set base 0xC329
puts $f [format "screen_id=%d hero_x=%d hero_y=%d hero_deadly=%d" [peek 0xCBC3] [peek 0xC6A0] [peek 0xC6C0] [peek 0xCDDC]]
puts $f [format "debug_screen_id=%d debug_hero_x=%d debug_hero_y=%d debug_hero_deadly=%d" [debug read "memory" 0xCBC3] [debug read "memory" 0xC6A0] [debug read "memory" 0xC6C0] [debug read "memory" 0xCDDC]]

foreach row {8 9 10 11 12 13 20 21 22 23} {
    set parts {}
    for {set col 0} {$col < 32} {incr col} {
        set value [peek [expr {$base + ($row * 32) + $col}]]
        set debugValue [debug read "memory" [expr {$base + ($row * 32) + $col}]]
        lappend parts [format "%02X/%02X" $value $debugValue]
    }
    puts $f [format "row_%02d %s" $row [join $parts " "]]
}

foreach idx {309 310 311 335 341 342 343 360 361 367 373 374 375 401 402 403 697 698 699 731 763} {
    puts $f [format "idx_%03d=%02X/%02X" $idx [peek [expr {$base + $idx}]] [debug read "memory" [expr {$base + $idx}]]]
}

close $f
quit
