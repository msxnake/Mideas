set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-light/boot_check.txt"
set f [open $log_path "w"]
proc logline {m} { global f; puts $f $m; flush $f }
set throttle off
set boots 0
set vb 0
debug set_bp 0x4010 {} { incr ::boots ; if {$::boots <= 2} { logline "INIT hit #$::boots" } ; debug cont }
debug set_bp 0x6086 {} { incr ::vb ; if {$::vb <= 3 || $::vb % 600 == 0} { logline "waitVblank #$::vb t=[machine_info time]" } ; if {$::vb >= 1800} { logline "DONE boots=$boots vb=$vb"; close $f; exit } ; debug cont }
logline "boot_check start"
