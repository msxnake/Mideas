set base_update_all 0xC01E
set base_exec_sm 0xC020
set base_sm_update 0xC022
set base_collision 0xC024
set base_wall 0xC026
set base_deadly 0xC028
set base_tile_interaction 0xC02A
set base_animation 0xC02C
set base_sprite 0xC02E
set base_music 0xC030
set base_deadly_reads 0xC032

proc read16 {addr} {
    set lo [debug read "memory" $addr]
    set hi [debug read "memory" [expr {$addr + 1}]]
    return [expr {$lo + 256 * $hi}]
}

proc log_line {fh text} {
    puts $fh $text
    flush $fh
}

proc dump_profile {label} {
    global base_update_all base_exec_sm base_sm_update base_collision
    global base_wall base_deadly base_tile_interaction base_animation
    global base_sprite base_music base_deadly_reads
    global logfh

    log_line $logfh "PROFILE $label"
    log_line $logfh [format "update_all_entities=%d" [read16 $base_update_all]]
    log_line $logfh [format "execute_all_state_machines=%d" [read16 $base_exec_sm]]
    log_line $logfh [format "SM_Update=%d" [read16 $base_sm_update]]
    log_line $logfh [format "update_collision_component=%d" [read16 $base_collision]]
    log_line $logfh [format "update_wallcollision_component=%d" [read16 $base_wall]]
    log_line $logfh [format "update_deadly_tiles_component=%d" [read16 $base_deadly]]
    log_line $logfh [format "check_tile_interaction=%d" [read16 $base_tile_interaction]]
    log_line $logfh [format "update_animation_component=%d" [read16 $base_animation]]
    log_line $logfh [format "update_sprite_component=%d" [read16 $base_sprite]]
    log_line $logfh [format "task_update_music=%d" [read16 $base_music]]
    log_line $logfh [format "deadly_behavior_reads=%d" [read16 $base_deadly_reads]]
}

set logfh [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_profile_stage1_move.log" "w"]
log_line $logfh "SCRIPT_START move"
set ::profile_done 0
after realtime 2500 { keymatrixdown RIGHT }
after realtime 5500 { keymatrixup RIGHT }
after realtime 7000 {
    if {[catch {dump_profile "move_right_5s"} err]} {
        log_line $logfh "ERROR $err"
    }
    set ::profile_done 1
}

vwait ::profile_done
close $logfh
after realtime 200 { exit }
