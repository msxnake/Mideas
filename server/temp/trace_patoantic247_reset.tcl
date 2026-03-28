set ::logfile "C:/Users/salam/Documents/Programacion/Mideas/server/temp/trace_patoantic247_reset.log"
file delete -force $::logfile

set ::hit_init_rom 0
set ::hit_restart_rom 0
set ::hit_restart_cont 0
set ::hit_init_game_systems 0
set ::hit_gameflow_start 0
set ::hit_pattern_far 0
set ::hit_color_far 0
set ::hit_irq0038 0

proc logline {msg} {
  set fh [open $::logfile a]
  puts $fh $msg
  close $fh
  puts $msg
}

proc log_mapper_state {tag} {
  logline [format "%s pc=%04X sp=%04X p1=%02X p2=%02X p3=%02X p4=%02X saved=%02X romslot=%02X screenbank=%02X behbank=%02X" \
    $tag [reg PC] [reg SP] \
    [peek 0xC01C] [peek 0xC01D] [peek 0xC01E] [peek 0xC01F] \
    [peek 0xC020] [peek 0xC017] [peek 0xC13E] [peek 0xC141]]
}

proc bp_init_rom {} {
  incr ::hit_init_rom
  log_mapper_state [format "init_rom#%d" $::hit_init_rom]
  debug cont
}

proc bp_restart_rom {} {
  incr ::hit_restart_rom
  log_mapper_state [format "restart_rom#%d" $::hit_restart_rom]
  debug cont
}

proc bp_restart_cont {} {
  incr ::hit_restart_cont
  log_mapper_state [format "restart_cont#%d" $::hit_restart_cont]
  debug cont
}

proc bp_init_game_systems {} {
  incr ::hit_init_game_systems
  log_mapper_state [format "init_game_systems#%d" $::hit_init_game_systems]
  debug cont
}

proc bp_gameflow_start {} {
  incr ::hit_gameflow_start
  log_mapper_state [format "gameflow_start#%d" $::hit_gameflow_start]
  debug cont
}

proc bp_pattern_far {} {
  incr ::hit_pattern_far
  log_mapper_state [format "pattern_far#%d" $::hit_pattern_far]
  debug cont
}

proc bp_color_far {} {
  incr ::hit_color_far
  log_mapper_state [format "color_far#%d" $::hit_color_far]
  debug cont
}

proc bp_irq0038 {} {
  incr ::hit_irq0038
  log_mapper_state [format "irq0038#%d" $::hit_irq0038]
  debug cont
}

debug set_bp 0x4010 {} bp_init_rom
debug set_bp 0x401C {} bp_restart_rom
debug set_bp 0x4022 {} bp_restart_cont
debug set_bp 0x45AB {} bp_init_game_systems
debug set_bp 0xA008 {} bp_gameflow_start
debug set_bp 0x4523 {} bp_pattern_far
debug set_bp 0x4567 {} bp_color_far
debug set_bp 0x0038 {} bp_irq0038

after realtime 6000 {
  log_mapper_state "FINAL"
  logline [format "counts init=%d restart=%d cont=%d initsys=%d gfstart=%d pfar=%d cfar=%d irq0038=%d" \
    $::hit_init_rom $::hit_restart_rom $::hit_restart_cont $::hit_init_game_systems \
    $::hit_gameflow_start $::hit_pattern_far $::hit_color_far $::hit_irq0038]
  logline [format "disasm=%s" [debug disasm [reg PC]]]
  exit
}
