# Claude probe: raw dump of the enemy RAM block.
#
# The previous probe read slot0 and slot1 as identical, and a count that does
# not match the fixture. Rather than guess a stride, dump the bytes and let the
# layout show itself. Assuming an offset is exactly how you measure the wrong
# thing and believe it.
#
# bitmap_enemy_count 0xD000, bitmap_enemy_pool 0xD001, block is 214 bytes.

set OUT "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_probe/dump.txt"
set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }
proc rb {a} { return [debug read memory $a] }

set n 0
proc dump {} {
    incr ::n
    say "--- sample $::n  (count=[rb 0xD000]) ---"
    for {set row 0} {$row < 14} {incr row} {
        set a [expr {0xD000 + $row * 16}]
        set line [format "%04X:" $a]
        for {set i 0} {$i < 16} {incr i} {
            append line [format " %02X" [rb [expr {$a + $i}]]]
        }
        say $line
    }
    if {$::n >= 3} { say "done"; close $::LOG; exit }
    after time 2.0 dump
}
# The room came up around t07 in the boot probe, so start well after that.
after time 10.0 dump
