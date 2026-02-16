proc d {msg} { puts $msg }
set rom "C:/Users/salam/Downloads/pato13_final_nondebug.rom"
carta $rom
reset
# wait boot + init + gameflow text
after time 9000
# try to continue from text screen if needed
set a [debug read "VDP regs" 1]
d "R1=[format 0x%02X $a]"
# Dump sprite attribute entries 0..5
for {set s 0} {$s < 6} {incr s} {
  set base [expr {0x1B00 + $s*4}]
  set y [debug read "VRAM" $base]
  set x [debug read "VRAM" [expr {$base+1}]]
  set p [debug read "VRAM" [expr {$base+2}]]
  set c [debug read "VRAM" [expr {$base+3}]]
  d [format "SPR%d Y=%d X=%d PAT=%d COL=%d" $s $y $x $p [expr {$c & 0x0F}]]
}
# Dump sprite pattern bytes for pattern 0 and 4 (entity0 layers)
set spbase 0x3800
for {set pat 0} {$pat <= 4} {incr pat 4} {
  set addr [expr {$spbase + $pat*8}]
  set line "PAT$pat"
  for {set i 0} {$i < 16} {incr i} {
    set v [debug read "VRAM" [expr {$addr+$i}]]
    append line [format " %02X" $v]
  }
  d $line
}
# check first byte of second half for both 16x16 layers (offset +16)
for {set pat 0} {$pat <= 4} {incr pat 4} {
  set addr [expr {$spbase + $pat*8 + 16}]
  set v [debug read "VRAM" $addr]
  d [format "PAT%d_OFF16 %02X" $pat $v]
}
after time 200
quit
