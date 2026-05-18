set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas115_music_probe_filtered.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas115_music_probe_filtered_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { if {[catch {debug read memory $addr} value]} { return 0 }; return $value }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }

proc state {tag} {
    set pc [reg PC]; set sp [reg SP]
    set p1 [mem8 0xC137]; set p2 [mem8 0xC138]; set p3 [mem8 0xC139]; set p4 [mem8 0xC13A]
    set irq [mem16 0xE960]; set inirq [mem8 0xE965]
    set music [mem8 0xE969]; set lock [mem8 0xE966]; set track [mem8 0xE96E]; set row [mem8 0xE972]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X irq=%04X inirq=%02X lock=%02X music=%02X track=%02X row=%02X" $tag $pc $sp $p1 $p2 $p3 $p4 $irq $inirq $lock $music $track $row]
}

proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $name $err" } else { logline "SHOTOK $name" }
}

debug set_bp 0x4010 {} {
    state "BP_INIT"
    debug cont
}
debug set_bp 0x6200 {} {
    if {[mem8 0xC137] == 12} { state "BP_MUSIC_HANDLER_BANK0C" }
    debug cont
}
debug set_bp 0x55E7 {} {
    state "BP_CALL_MUSIC_RESIDENT"
    debug cont
}
debug set_bp 0x4C2E {} {
    state "BP_MUSIC_FAR"
    debug cont
}
debug set_bp 0x626C {} {
    if {[mem8 0xC137] == 8} { state "BP_MUSIC_EXEC_BANK08" }
    debug cont
}
debug set_bp 0x65BA {} {
    if {[mem8 0xC137] == 8} { state "BP_MUSIC_PLAY_BANK08" }
    debug cont
}
debug set_bp 0x480B {} {
    state "BP_RESOURCE_LOAD"
    debug cont
}

after time 0.5 { state "T00_5" }
after time 1.0 { state "T01" }
after time 2.0 { state "T02" }
after time 3.0 { shot "t03.png" "T03" }
after time 4.0 { state "T04" }
after time 4.5 { state "T04_5" }
after time 5.0 { shot "t05.png" "T05" }
after time 6.0 { state "T06" }
after time 8.0 { shot "t08.png" "T08" }
after time 10.0 { shot "t10.png" "T10"; close $f; exit }
