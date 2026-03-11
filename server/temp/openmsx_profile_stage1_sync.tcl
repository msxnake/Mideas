set ::logfh [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_profile_stage1_sync.log" w]

proc read16 {addr} {
    set lo [machine1::peek $addr]
    set hi [machine1::peek [expr {$addr + 1}]]
    return [expr {$lo + 256 * $hi}]
}

proc write16 {addr value} {
    machine1::poke $addr [expr {$value & 255}]
    machine1::poke [expr {$addr + 1}] [expr {($value >> 8) & 255}]
}

puts $::logfh "SCRIPT_START"
flush $::logfh

set machines [list_machines]
puts $::logfh [format "machines=%s" $machines]
if {[llength $machines] > 0} {
    activate_machine [lindex $machines 0]
    puts $::logfh [format "active_machine=%s" [machine]]
}
flush $::logfh

reset
after 1000
cart "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic165_profile_stage1.rom"
reset
after 4000

puts $::logfh [format "screen_id=%d" [machine1::peek 0xCBD9]]
puts $::logfh [format "ram_test_before=%d" [machine1::peek 0xC000]]
machine1::poke 0xC000 90
puts $::logfh [format "ram_test_after=%d" [machine1::peek 0xC000]]
flush $::logfh

set throttle on
set speed 100

foreach addr {0xC01E 0xC020 0xC022 0xC024 0xC026 0xC028 0xC02A 0xC02C 0xC02E 0xC030 0xC032} {
    write16 $addr 0
}

puts $::logfh [format "zero_check_update_all_entities=%d" [read16 0xC01E]]
puts $::logfh [format "zero_check_execute_all_state_machines=%d" [read16 0xC020]]
flush $::logfh

after 250

puts $::logfh [format "update_all_entities=%d" [read16 0xC01E]]
puts $::logfh [format "execute_all_state_machines=%d" [read16 0xC020]]
puts $::logfh [format "SM_Update=%d" [read16 0xC022]]
puts $::logfh [format "update_collision_component=%d" [read16 0xC024]]
puts $::logfh [format "update_wallcollision_component=%d" [read16 0xC026]]
puts $::logfh [format "update_deadly_tiles_component=%d" [read16 0xC028]]
puts $::logfh [format "check_tile_interaction=%d" [read16 0xC02A]]
puts $::logfh [format "update_animation_component=%d" [read16 0xC02C]]
puts $::logfh [format "update_sprite_component=%d" [read16 0xC02E]]
puts $::logfh [format "task_update_music=%d" [read16 0xC030]]
puts $::logfh [format "deadly_behavior_reads=%d" [read16 0xC032]]
flush $::logfh

close $::logfh
exit
