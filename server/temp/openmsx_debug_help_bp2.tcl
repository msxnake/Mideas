set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/openmsx_debug_help_bp2.log" "w"]
foreach sub {set_bp set_watchpoint set_condition} {
  catch {puts $f "$sub => [help debug $sub]"} err
  puts $f "ERR=$err"
}
close $f
exit
