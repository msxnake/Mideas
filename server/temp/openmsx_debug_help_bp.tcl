set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_debug_help_bp.log" "w"]
foreach cmd {"debug set_bp" "debug set_watchpoint" "debug set_condition"} {
  catch {puts $f "$cmd => [help $cmd]"} err
  puts $f "ERR=$err"
}
close $f
exit
