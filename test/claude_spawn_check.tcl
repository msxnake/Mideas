# Claude probe: where do the two bosses SPAWN now that the path no longer
# overrides the placement?
#
# Instance state blocks: 0xD11B (slot 0) and 0xD13D (slot 1), 0x22 bytes each.
# Field order from bitmap_boss_state_load: active +0, x +1, y +2.
# Placed in test567: Alpha cell (4,4) -> 64,64 ; Beta cell (11,4) -> 176,64.

set base "C:/Users/salam/Documents/Programacion/Mideas/server/temp/claude_startnode_probe"
carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/claude_startnode.rom"

set LOG [open "${base}.txt" w]
set seen 0
proc rb {a} { return [debug read memory $a] }

proc look {} {
    global LOG seen
    if {[rb 0xC00B] == 255} { after time 0.05 look; return }
    if {[rb 0xD11B] == 0 && [rb 0xD13D] == 0} { after time 0.05 look; return }
    incr seen
    puts $LOG [format "t%d  slot0: active=%d (%3d,%3d)   slot1: active=%d (%3d,%3d)" \
        $seen [rb 0xD11B] [rb 0xD11C] [rb 0xD11D] [rb 0xD13D] [rb 0xD13E] [rb 0xD13F]]
    flush $LOG
    if {$seen == 1} { screenshot "${::base}_spawn.png" }
    if {$seen >= 6} { close $LOG; exit }
    after time 0.5 look
}

after time 7.0 look
after time 40 { exit }
