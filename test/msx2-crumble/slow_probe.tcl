# Slow erosion (20 frames per 2px stage): sample the pool slot so every stage is
# visible, and screenshot the bands being eaten off the top of the tile.
#   pool slot 0 at #D004 = cell, #D005 = stage, #D006 = tick
set result_path "test/msx2-crumble/slow_probe.txt"
proc snap {label} {
    global result_path
    set f [open $result_path a]
    set py [debug read memory 0xC000]
    set px [debug read memory 0xC001]
    set fl [debug read memory 0xC007]
    set cell  [debug read memory 0xD004]
    set stage [debug read memory 0xD005]
    set tick  [debug read memory 0xD006]
    set c37 [debug read memory 0xC083]
    set c27 [debug read memory 0xC082]
    puts $f "$label pos=($px,$py) grounded=[expr {$fl & 1}] slot0(cell=$cell stage=$stage tick=$tick) cell(3,7)=$c37 cell(2,7)=$c27"
    close $f
}
after time 4  { keymatrixdown 8 0x01 }
after time 4.2 { keymatrixup 8 0x01 }
after time 5  { keymatrixdown 8 0x01 }
after time 5.2 { keymatrixup 8 0x01 }
after time 6  { keymatrixdown 8 0x01 }
after time 6.2 { keymatrixup 8 0x01 }
for {set i 0} {$i < 20} {incr i} {
    set t [expr {6.4 + $i * 0.3}]
    after time $t "snap t$t"
}
after time 7.0  { screenshot test/msx2-crumble/slow_stage_a.png }
after time 8.0  { screenshot test/msx2-crumble/slow_stage_b.png }
after time 9.0  { screenshot test/msx2-crumble/slow_stage_c.png }
after time 12.5 { snap "end" ; screenshot test/msx2-crumble/slow_end.png ; after time 1 { exit } }
