# Claude probe: does this ROM even reach a live room?
#
# The suspects probe wrote a zero-byte log, which means it never armed AND
# never closed. Before believing anything about behaviour, find out how far the
# boot gets. Every line is flushed, so a crash mid-probe still leaves evidence.
#
# Symbols from server/temp/behaviour_probe/behaviour.sym (THIS build):
#   bitmap_enemy_count 0xD000, bitmap_enemy_pool 0xD001 (stride 28)
#   bitmap_load_enemies 0x58BD, bitmap_update_enemies 0x5BDE
#   bitmap_enemy_script_step 0x611F

set OUT "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_probe/boot.txt"
set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }

say "probe loaded"

set loads 0
set updates 0
set steps 0
set n 0

proc rb {a} { return [debug read memory $a] }

debug set_bp 0x58BD {} { incr ::loads }
debug set_bp 0x5BDE {} { incr ::updates }
debug set_bp 0x611F {} { incr ::steps }
say "breakpoints set"

proc tick {} {
    incr ::n
    set pool 0xD001
    set slot1 [expr {$pool + 28}]
    say [format "t%02d count=%3d  slot0(x=%3d y=%3d mode=%3d)  slot1(x=%3d y=%3d mode=%3d state=%3d vy=%3d)  loads=%d updates=%d steps=%d" \
        $::n [rb 0xD000] \
        [rb $pool] [rb [expr {$pool+1}]] [rb [expr {$pool+13}]] \
        [rb $slot1] [rb [expr {$slot1+1}]] [rb [expr {$slot1+13}]] [rb [expr {$slot1+25}]] [rb [expr {$slot1+27}]] \
        $::loads $::updates $::steps]
    if {$::n >= 30} { say "done"; close $::LOG; exit }
    after time 1.0 tick
}
after time 1.0 tick
