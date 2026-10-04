# Focused timing probe for the deferred Boss renderer.
set root "C:/Users/salam/Documents/Programacion/Mideas/work"
set f [open "$root/test607_deferred_timing.txt" w]
set sf [open "$root/test607_deferred_render.sym" r]
set syms [read $sf]
close $sf
proc sym {label} {
    if {![regexp -line "^${label}: equ (\[0-9A-Fa-f\]+)H" $::syms -> hex]} { error "Missing symbol $label" }
    scan $hex %x addr
    return $addr
}
proc say {msg} { puts $::f $msg; flush $::f }
proc event_bp {tag} {
    global last_event_t last_event_tag
    set t [machine_info time]
    if {$last_event_t >= 34.0 && $last_event_t < 40.0} {
        set dt [expr {($t - $last_event_t) * 1000.0}]
        if {$dt > 5.0} {
            say [format "EVENT_GAP from=%s to=%s dt=%.3f t=%.3f" $last_event_tag $tag $dt $t]
        }
    }
    set last_event_t $t
    set last_event_tag $tag
    debug cont
}
set last_event_t -1.0
set last_event_tag boot
set probes {
    wait bitmap_wait_vblank
    room step_room_composition
    player_sat bitmap_update_sprite_sat
    player_col bitmap_upload_player_frame_colors
    enemy_sat bitmap_update_enemy_sat
    boss_sat bitmap_boss_sbul_sat
    boss_col bitmap_boss_sbul_anim_colors
    boss bitmap_boss_update
    render bitmap_boss_render_step
    try_cmd bitmap_boss_try_launch_cmd
    boss_busy bitmap_boss_cmd_busy
    room_anim bitmap_sway_update
    enemies bitmap_update_enemies
    enemy_touch bitmap_check_enemy_touch
    turrets bitmap_update_turrets
    hud0 update_hud_linked_0
    hud1 update_hud_linked_1
    hud2 update_hud_linked_2
    hud3 update_hud_linked_3
    movement update_player_movement
    bullets bitmap_step_bullets
    music music_update
}
after time 6.0 {
    foreach {tag label} $::probes {
        set addr [sym $label]
        debug set_bp $addr {} [list event_bp $tag]
    }
    debug cont
}

# Reach the Boss room and reproduce the same post-dialogue movement window.
after time 6  { keymatrixdown 8 0x01 }
after time 6.5 { keymatrixup 8 0x01 }
after time 8  { keymatrixdown 8 0x01 }
after time 8.5 { keymatrixup 8 0x01 }
after time 10 { keymatrixdown 8 0x01 }
after time 10.5 { keymatrixup 8 0x01 }
after time 12 { keymatrixdown 8 0x80 }
after time 29 { keymatrixup 8 0x80 }
foreach t {13 15 17 19 21 23 25 27} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t+0.4}] "keymatrixup 8 0x01"
}
foreach t {24 25 26 27 28 29 30 31 32 33 34} {
    after time $t "keymatrixdown 8 0x20"
    after time [expr {$t+0.25}] "keymatrixup 8 0x20"
}
after time 35 { keymatrixdown 8 0x80 }
after time 40 { keymatrixup 8 0x80 }
after time 41 {
    say done
    close $::f
    exit
}
say test607_deferred_timing
