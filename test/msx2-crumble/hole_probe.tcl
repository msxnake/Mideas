# Control run: the hole in row 7 col 3 is authored, no crumbling cell exists.
# Where does the player end up? That tells us what the ENGINE does with this
# geometry, independently of the crumbling-floor feature.
set result_path "test/msx2-crumble/hole_probe.txt"
proc snap {label} {
    global result_path
    set f [open $result_path a]
    set py  [debug read memory 0xC000]
    set px  [debug read memory 0xC001]
    set fl  [debug read memory 0xC007]
    set c37 [debug read memory 0xC083]
    set c39 [debug read memory 0xC0A3]
    puts $f "$label pos=($px,$py) flags=$fl cell(3,7)=$c37 cell(3,9)=$c39"
    close $f
}
after time 4  { keymatrixdown 8 0x01 }
after time 4.2 { keymatrixup 8 0x01 }
after time 5  { keymatrixdown 8 0x01 }
after time 5.2 { keymatrixup 8 0x01 }
after time 6  { keymatrixdown 8 0x01 }
after time 6.2 { keymatrixup 8 0x01 }
for {set i 0} {$i < 24} {incr i} {
    set t [expr {6.3 + $i * 0.1}]
    after time $t "snap t$t"
}
after time 9 { snap "end" ; screenshot test/msx2-crumble/hole_end.png ; after time 1 { exit } }
