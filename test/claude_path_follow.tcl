# Does a PATH FOLLOW route actually drive an enemy on hardware?
#
# The chain is green end to end in unit checks, and none of that proves the body
# moves. What this measures is the only thing that counts: the node index in the
# pool ADVANCING as the enemy walks over each node's cell, and the direction
# flipping when a SET_DIR node fires.
#
# The route (Jordi's example, laid along row 8, the platform the enemy stands on):
#   1 @cell 12  go left      2 @cell 4   go right
#   3 @cell 9   fork         4a @cell 13 jump      4b @cell 6  go left
#
# Addresses from server/temp/behaviour_visual/path_fixed.sym of THIS build:
#   bitmap_enemy_script_path_step 0x6166   (breakpoint = the walker ran)
#   bitmap_enemy_pool  #D0D4   stride 32: x+0, y+1, dx+2, prog+24, node+30, mask+31
#   bitmap_enemy_count #D0D3

set OUT "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual/path_follow.txt"
set LOG [open $OUT w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set POOL   0xD0D4
set STRIDE 32
set steps 0
set n 0
set seenNodes {}

debug set_bp 0x6166 {} { incr ::steps }

proc rb {a} { return [debug read memory $a] }
proc slot {off} { return [rb [expr {$::POOL + $off}]] }

proc arm {} {
    if {[rb 0xD0D3] == 0 || [slot 1] > 200} { after time 0.5 arm; return }
    say "count=[rb 0xD0D3] prog=[slot 24] node=[slot 30] mask=[slot 31]"
    say "walker corrio? steps=$::steps"
    say ""
    say "  s |   x  celda | dx | nodo mask | pasos"
    after time 0.5 tick
}

proc tick {} {
    incr ::n
    set x [slot 0]
    set cell [expr {$x >> 4}]
    set node [slot 30]
    if {[lsearch $::seenNodes $node] < 0} { lappend ::seenNodes $node }
    set dx [slot 2]
    if {$dx > 127} { set dx [expr {$dx - 256}] }
    say [format "%3d | %3d %6d | %2d | %4d %4d | %5d" $::n $x $cell $dx $node [slot 31] $::steps]
    if {$::n >= 30} {
        say ""
        say "result=COMPLETE nodosVisitados={$::seenNodes} pasosWalker=$::steps"
        close $::LOG
        exit
    }
    after time 0.5 tick
}

after time 4.0 arm
after time 45.0 { say "result=TIMEOUT steps=$::steps"; close $::LOG; exit }
