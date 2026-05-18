set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic_credits_debug.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc state {tag} { logline [format "%s pc=%04X sp=%04X p1=%02X lock=%02X inirq=%02X key8=%02X" $tag [reg PC] [reg SP] [mem8 0xC15A] [mem8 0xEA15] [mem8 0xEA14] [debug read keymatrix 8]] }
proc down_space {} { keymatrixdown 8 0x01; state "down_space" }
proc up_space {} { keymatrixup 8 0x01; state "up_space" }
proc down_down {} { keymatrixdown 8 0x40; state "down_down" }
proc up_down {} { keymatrixup 8 0x40; state "up_down" }
proc tap_space {} { down_space; after time 0.25 up_space }
proc tap_down {} { down_down; after time 0.35 up_down }
set wfh_hits 0
debug set_bp 0x94DB {} { global wfh_hits; incr wfh_hits; if {$wfh_hits < 10} { state "BP_wait_$wfh_hits" }; debug cont }
set conf_hits 0
debug set_bp 0x5702 {} { global conf_hits; incr conf_hits; if {$conf_hits < 20} { state "BP_confirm_far_$conf_hits" }; debug cont }
after time 8.0 { tap_space }
after time 9.2 { tap_down }
after time 10.4 { tap_space }
after time 11.5 { state "at_credits" }
after time 12.4 { tap_space }
after time 13.2 { state "after_exit_space" }
after time 16.0 { state "final"; close $f; exit }
