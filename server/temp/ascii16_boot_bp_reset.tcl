set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_boot_bp_reset.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set pc [reg PC]; set sp [reg SP]
    set p1 [mem8 0xC11D]; set p2 [mem8 0xC11E]; set p3 [mem8 0xC11F]; set p4 [mem8 0xC120]
    set flow [mem8 0xC104]; set screen [mem8 0xE0E6]; set irq [mem16 0xE788]; set inirq [mem8 0xE78D]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X inirq=%02X" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $irq $inirq]
}
foreach {addr name} {0x4010 bp4010 0x4022 restart_continue 0x4172 mapper_init 0x4B57 install_bridge 0x51AF call_init_sound 0x4F45 init_sound_far 0x52D4 init_game_systems 0x4D79 gameflow_init_far 0x4D8D gameflow_start_far 0x407C main_loop 0x6000 overlay6000 0x65B0 sm_update_sound} {
    debug set_bp $addr {} "state $name; debug cont"
}
reset
for {set i 1} {$i <= 16} {incr i} {
    set t [expr {$i * 0.25}]
    after time $t [list state "t$i"]
}
after time 4.5 { close $f; exit }
