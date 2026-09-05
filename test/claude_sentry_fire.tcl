# Does the scripted FIRE actually put a bullet on screen, and does it TRAVEL?
#
# First attempt stood the player right next to the enemy: it fired once and the
# bullet vanished the same frame, because a bullet that spawns on top of its
# target is consumed before it can move. "Fired" and "flew" are different
# questions and that setup could only answer the first.
#
# So: park the player far to the LEFT, on the enemy's row, and hold it there.
# Holding it takes a re-poke every sample — the player has physics and there is
# no floor at that height — but the point is to keep the LINE, not to simulate
# a player. Then the bullet has ~90px of empty room to cross.
#
# Addresses from server/temp/behaviour_visual/sentry.sym of THIS build:
#   bitmap_enemy_bullet_spawn 0x6745   (breakpoint = shots fired)
#   bitmap_enemy_bullet_pool  #D149    4 bytes/slot: active, x, y, dir
#   bitmap_enemy_pool         #D0D4    stride 30: x+0, y+1, dx+2, state+25
#   player_x #C001, player_y #C000

set OUTDIR "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual"
set LOG [open "$OUTDIR/sentry_fire.txt" w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set POOL    0xD0D4
set STRIDE  30
set BULLETS 0xD149
set PLX     100
set PLY     128
set shots 0
set n 0
set flying 0
set maxTravel 0
set spawnX -1
set recording 0

debug set_bp 0x6745 {} { incr ::shots }

proc rb {a} { return [debug read memory $a] }
proc slot {i off} { return [rb [expr {$::POOL + $i * $::STRIDE + $off}]] }
proc bullet {i off} { return [rb [expr {$::BULLETS + $i * 4 + $off}]] }

proc hold {} {
    debug write memory 0xC001 $::PLX
    debug write memory 0xC000 $::PLY
}

proc start {} {
    if {[rb 0xD0D3] == 0 || [slot 0 1] > 200} { after time 0.5 start; return }
    hold
    if {![catch { record start "$::OUTDIR/sentry_fire.avi" }]} { set ::recording 1 }
    say "player sujeto en x=$::PLX y=$::PLY, enemigo en x=[slot 0 0] y=[slot 0 1], rec=$::recording"
    say ""
    say "  f | enX dx st | disparos | bala0 act x y dir | bala1 act x y dir"
    after time 0.2 tick
}

proc tick {} {
    incr ::n
    hold
    if {$::n % 2 == 1} { screenshot -raw [format "%s/fire_%02d.png" $::OUTDIR $::n] }
    set a0 [bullet 0 0]
    set a1 [bullet 1 0]
    if {$a0 != 0 || $a1 != 0} {
        set ::flying 1
        set bx [expr {$a0 != 0 ? [bullet 0 1] : [bullet 1 1]}]
        if {$::spawnX < 0} { set ::spawnX $bx }
        set d [expr {$::spawnX - $bx}]
        if {$d < 0} { set d [expr {-$d}] }
        if {$d > $::maxTravel} { set ::maxTravel $d }
    }
    say [format "%3d | %3d %3d %2d | %8d | %d %3d %3d %3d | %d %3d %3d %3d" \
        $::n [slot 0 0] [slot 0 2] [slot 0 25] $::shots \
        $a0 [bullet 0 1] [bullet 0 2] [bullet 0 3] \
        $a1 [bullet 1 1] [bullet 1 2] [bullet 1 3]]
    if {$::n >= 60} {
        if {$::recording} { catch { record stop } }
        say ""
        say "result=COMPLETE disparos=$::shots balaActivaVista=$::flying recorridoMax=$::maxTravel px"
        close $::LOG
        exit
    }
    after time 0.05 tick
}

after time 5.0 start
after time 45.0 { catch { record stop }; say "result=TIMEOUT"; close $::LOG; exit }
