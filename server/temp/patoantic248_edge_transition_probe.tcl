set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_edge_transition_probe.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set pc [reg PC]; set sp [reg SP]
    set p1 [mem8 0xC053]; set p2 [mem8 0xC054]; set p3 [mem8 0xC055]
    set flow [mem8 0xC03B]; set exit [mem8 0xC03D]; set screen [mem8 0xE531]
    set input [mem8 0xC000]; set player [mem8 0xE540]
    set px [mem16 0xE53B]; set py [mem16 0xE53D]
    set vx [mem8 0xE541]; set vy [mem8 0xE542]
    logline [format "%s pc=%04X sp=%04X p=%02X/%02X/%02X flow=%02X exit=%02X screen=%02X in=%02X player=%02X pxy=%d,%d v=%02X/%02X" $tag $pc $sp $p1 $p2 $p3 $flow $exit $screen $input $player $px $py $vx $vy]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc press {tag mask hold} { state ${tag}_before; down $mask; after time $hold [list release $tag $mask] }
proc release {tag mask} { up $mask; state ${tag}_after }
proc tap_space {tag} { press $tag 1 0.22 }

debug set_bp 0x0000 {} { state "BP_0000"; debug cont }
debug set_bp 0x4010 {} { state "BP_4010_RESET_OR_INIT"; debug cont }
debug set_bp 0xA631 {} { state "BP_transition_call"; debug cont }

after time 7.0 { tap_space "intro" }
after time 12.0 { tap_space "start" }
after time 13.5 { state "game_start" }
after time 14.0 { press "hold_right" 128 7.0 }
after time 16.0 { state "during_right_16" }
after time 18.0 { state "during_right_18" }
after time 20.0 { state "during_right_20" }
after time 22.0 { state "after_right" }
after time 22.5 { press "hold_left" 16 7.0 }
after time 25.0 { state "during_left_25" }
after time 28.0 { state "during_left_28" }
after time 30.0 { state "final"; close $f; exit }
