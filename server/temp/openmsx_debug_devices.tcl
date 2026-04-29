set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_debug_devices.log"
set f [open $log_path "w"]
proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}
catch {logline [debug list]} err
if {$err ne ""} { logline "debug list err=$err" }
catch {logline [machine_info]} err2
if {$err2 ne ""} { logline "machine_info err=$err2" }
close $f
exit
