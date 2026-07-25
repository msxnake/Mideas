set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_kill.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }

# boss_active #C176 x #C177 y #C178 hp #C17D defeated_base #C192
# bullet pool #C0DA (active,x,y,dir), screen_index #C00B
proc sample {tag} {
    set scr [mem8 0xC00B]
    logline [format "%s active=%d x=%d y=%d hp=%d defeated\[%d\]=%d player_hp=%d" \
        $tag [mem8 0xC176] [mem8 0xC177] [mem8 0xC178] [mem8 0xC17D] \
        $scr [mem8 [expr {0xC192 + $scr}]] [mem8 0xC1FD]]
}
proc poke_bullet {} {
    set bx [mem8 0xC177]
    set by [mem8 0xC178]
    debug write memory 0xC0DA 1
    debug write memory 0xC0DB [expr {($bx + 20) & 0xff}]
    debug write memory 0xC0DC [expr {($by + 20) & 0xff}]
    debug write memory 0xC0DD 0
}

# boot through the main menu
foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}

# Phase B chain barrier: collision_map #C010, index = row*16 + col.
# Perimeter probes: r0c8 (top) #C018, r5c0 (west) #C050, r11c8 (bottom) #C0C8.
proc barrier_probe {tag} {
    logline [format "%s barrier top(r0c8)=%d west(r5c0)=%d bottom(r11c8)=%d" \
        $tag [mem8 0xC018] [mem8 0xC050] [mem8 0xC0C8]]
}
after time 12.0 {
    sample "before"
    barrier_probe "alive"
    screenshot -prefix boss_alive_
}
# Phase D sprite-bullet pool at #C1AE, 5 bytes/slot: active, x, y, dx, dy.
# Cooldown at #C1AC. These slots live in the (unused) enemy SAT range.
proc proj_probe {tag} {
    logline [format "%s s0 a=%d x=%d y=%d d=%d,%d | s1 a=%d x=%d y=%d | s2 a=%d | cd=%d php=%d" \
        $tag [mem8 0xC1AE] [mem8 0xC1AF] [mem8 0xC1B0] [mem8 0xC1B1] [mem8 0xC1B2] \
        [mem8 0xC1B3] [mem8 0xC1B4] [mem8 0xC1B5] [mem8 0xC1B8] \
        [mem8 0xC1AC] [mem8 0xC1FD]]
}
for {set i 0} {$i < 10} {incr i} {
    after time [expr {12.2 + $i * 0.20}] { proj_probe "fly" }
}
after time 12.35 { screenshot -prefix boss_proj_ }
# Deterministic kill: drop the boss to its last hit point, then feed bullets.
# (Injecting bullets is timing-sensitive because the bullet keeps travelling
# between the poke and the collision pass; this isolates the DEATH chain.)
after time 14.0 { debug write memory 0xC17D 1 ; logline "forced boss_hp=1" }
for {set i 0} {$i < 40} {incr i} {
    set t [expr {14.2 + $i * 0.12}]
    after time $t { poke_bullet }
    after time [expr {$t + 0.06}] { logline [format "bul a=%d x=%d y=%d | boss x=%d y=%d hp=%d" [mem8 0xC0DA] [mem8 0xC0DB] [mem8 0xC0DC] [mem8 0xC177] [mem8 0xC178] [mem8 0xC17D]] }
}
after time 20.5 {
    sample "after_death"
    # Phase A Boss Defeat Actions: setFlag -> boss_flags[0] at #C19F must be 1.
    logline [format "defeat_action boss_flags\[0\]=%d" [mem8 0xC19F]]
    # Phase B chain barrier: perimeter collision must be cleared after death.
    barrier_probe "dead"
    screenshot -prefix boss_dead_
    after time 1 { exit }
}
