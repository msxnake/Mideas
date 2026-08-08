# Crumbling floor (Manic Miner) smoke — see make_fixture.py for the geometry.
#
#   player_y 80 (standing on crumbling row 6)  ->  96 (dropped onto row 7)
#   collision cell (3,6) #C073: #10 -> 0 ; controls (2,6) #C072 and (4,6) #C074 stay #10
#   pool slot 0 at #D004 = cell, #D005 = stage (1..8), #D006 = tick
#
# Every line logs player_y and grounded: "the cell opened" proves nothing if the
# player was not standing on it.
set result_path "test/msx2-crumble/crumble_probe.txt"
proc snap {label} {
    global result_path
    set f [open $result_path a]
    set py [debug read memory 0xC000]
    set fl [debug read memory 0xC007]
    puts $f [format "%-7s y=%-4s grounded=%s slot0(cell=%-4s stage=%s tick=%-3s) c(2,6)=%-3s c(3,6)=%-3s c(4,6)=%-3s" \
        $label $py [expr {$fl & 1}] \
        [debug read memory 0xD004] [debug read memory 0xD005] [debug read memory 0xD006] \
        [debug read memory 0xC072] [debug read memory 0xC073] [debug read memory 0xC074]]
    close $f
}
after time 4  { keymatrixdown 8 0x01 } ; after time 4.2 { keymatrixup 8 0x01 }
after time 5  { keymatrixdown 8 0x01 } ; after time 5.2 { keymatrixup 8 0x01 }
after time 6  { keymatrixdown 8 0x01 } ; after time 6.2 { keymatrixup 8 0x01 }
# The tile takes 160 frames (~2.7 s) to vanish: sample every 0.2 s so each of the
# 8 stages shows up, and screenshot the bands being eaten off the top.
for {set i 0} {$i < 30} {incr i} {
    set t [expr {8.8 + $i * 0.2}]
    after time $t "snap t$t"
}
after time 9.0  { screenshot test/msx2-crumble/crumble_stage0.png }
after time 10.0 { screenshot test/msx2-crumble/crumble_stage3.png }
after time 11.0 { screenshot test/msx2-crumble/crumble_stage6.png }
after time 15.0 { snap "end" ; screenshot test/msx2-crumble/crumble_end.png ; after time 1 { exit } }
