set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_loop_stub_probe.log"
set f [open $log_path "w"]
array set hits {}
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr+1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} { set pc [reg PC]; set sp [reg SP]; set a [reg A]; set h [reg H]; set l [reg L]; set d [reg D]; set e [reg E]; set p1 [mem8 0xC11D]; set p3 [mem8 0xC11F]; set irq [mem16 0xE829]; set player [mem8 0xE195]; set screen [mem8 0xE187]; logline [format "%s pc=%04X sp=%04X a=%02X hl=%02X%02X de=%02X%02X p1=%02X p3=%02X irq=%d player=%02X screen=%02X" $tag $pc $sp $a $h $l $d $e $p1 $p3 $irq $player $screen] }
proc bp {name limit} { global hits; if {![info exists hits($name)]} {set hits($name) 0}; incr hits($name); if {$hits($name) <= $limit} {state $name}; debug cont }
proc qbp {name limit bank} { global hits; if {![info exists hits($name)]} {set hits($name) 0}; if {[mem8 0xC11D] == $bank} {incr hits($name); if {$hits($name) <= $limit} {state $name}}; debug cont }
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state ${tag}_before; down 1; after time 0.22 [list up 1]; after time 0.32 [list state ${tag}_after] }

# game loop and gameflow nodes
debug set_bp 0x65D9 {} { qbp HANDLE_WORLDLINK 4 6 }
debug set_bp 0x6732 {} { qbp LOOP_START 20 6 }
debug set_bp 0x6792 {} { qbp LOOP_AFTER_HUD_SKIP 20 6 }
# gameflow local stubs used in loop/worldlink
foreach {addr name} {
  0x6C09 a16r8_15_update_s 0x6C19 a16r8_16_call_ren 0x6C39 a16r8_18_task_upd 0x6C49 a16r8_19_update_p 0x6C59 a16r8_20_call_che 0x6C69 a16r8_21_update_a 0x6C79 a16r8_22_refresh 0x6C89 a16r8_23_refresh 0x6C99 a16r8_24_refresh 0x6CA9 a16r8_25_call_exe 0x6CB9 a16r8_26_refresh 0x6CC9 a16r8_27_update_w 0x6CD9 a16r8_28_call_sfx 0x6CE9 a16r8_29_refresh 0x6CF9 a16r8_30_refresh 0x6D09 a16r8_31_call_upd 0x6D19 a16r8_32_call_upd 0x6B79 a16r8_6_call_upd
} { debug set_bp $addr {} [list qbp $name 8 6] }
# resident bridge return, log when returning to bank0 unexpectedly with PC in gameflow range after return is hard; still sample
debug set_bp 0xC1F5 {} { bp RESIDENT_RET 80 }

after time 7.0 { tap_space SPC1 }
after time 12.0 { tap_space SPC2 }
after time 15.0 { state FINAL; global hits f; foreach k [lsort [array names hits]] {logline [format "COUNT %s %d" $k $hits($k)]}; close $f; exit }
