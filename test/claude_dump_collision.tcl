# What is actually under the enemy? Dump the room's 16x12 collision grid
# instead of reasoning about it from the ASM.
#
#   bitmap_room_collision_map #C010, index = (Y & #F0) + (X >> 4)
#   bitmap_enemy_pool         #D0D4

set OUT "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual/collision_map.txt"
set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }
proc rb {a} { return [debug read memory $a] }

proc dump {} {
    if {[rb 0xD0D3] == 0 || [rb 0xD0D5] > 200} { after time 0.5 dump; return }
    set ex [rb 0xD0D4]
    set ey [rb 0xD0D5]
    say "enemigo x=$ex y=$ey -> columna [expr {$ex >> 4}], fila [expr {$ey >> 4}]"
    say ""
    say "fila  y     columnas 0..15 (hex)"
    for {set row 0} {$row < 12} {incr row} {
        set line ""
        for {set col 0} {$col < 16} {incr col} {
            append line [format "%02X " [rb [expr {0xC010 + $row * 16 + $col}]]]
        }
        say [format "%3d %4d  %s" $row [expr {$row * 16}] $line]
    }
    close $::LOG
    exit
}

after time 5.0 dump
after time 30.0 { say "TIMEOUT"; close $::LOG; exit }
