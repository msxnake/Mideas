# Two cases that isolate the Room Lock fix.
#   A: an opening with the player far away  -> the resweep must seal it (#80)
#   B: an opening with the player standing on it -> it must stay open (#00)
# Cell (col,row) collision byte lives at bitmap_room_collision_map + row*16 + col.
set f [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/roomlock_reseal.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc M {a} { return [debug read memory $a] }
proc W {a v} { debug write memory $a $v }
proc cell {col row} { return [M [expr {0xC010 + $row*16 + $col}]] }
proc opencell {col row} { W [expr {0xC010 + $row*16 + $col}] 0x00 }
proc kick {} { W 0xC1A5 1 ; W 0xC1A6 1 }   ; # pending=1, retry=1 -> sweep next frame

foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}

after time 13 {
    L "boot: boss=[M 0xC176] player=([M 0xC001],[M 0xC000]) screen=[M 0xC00B]"
    L "baseline cell(0,9)=[format %02X [cell 0 9]] cell(0,5)=[format %02X [cell 0 5]]"
}

# ---- case A: player far away, opening must get sealed ----
after time 14 { opencell 0 5 ; L "A: opened cell(0,5) -> [format %02X [cell 0 5]] , player at ([M 0xC001],[M 0xC000])" ; kick }
after time 15 { L "A: after sweep cell(0,5)=[format %02X [cell 0 5]] pending=[M 0xC1A5]" }

# ---- case B: player parked on the opening, it must stay open ----
proc park {} { W 0xC001 2 ; W 0xC000 80 ; after frame park }
after time 16 { park ; L "B: parked player at (2,80) -> col0 rows5-6" }
after time 17 { opencell 0 5 ; L "B: opened cell(0,5) -> [format %02X [cell 0 5]]" ; kick }
after time 18 { L "B: after sweep cell(0,5)=[format %02X [cell 0 5]] pending=[M 0xC1A5]" }
after time 19 { after time 1 { exit } }
