set fd [open "C:/Users/salam/Downloads/openmsx_after_help.log" "w"]
foreach cmd {"help after" "help screenshot" "help exit"} {
    if {[catch {eval $cmd} r]} { puts $fd "$cmd ERR $r" } else { puts $fd "$cmd OK $r" }
}
flush $fd
exit
