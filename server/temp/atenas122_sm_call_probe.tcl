set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas122_sm_call_probe.log"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16seq {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}
proc state {tag} {
    set ptrlo [mem8 0xDB1E]
    set ptrhi [mem8 0xDB3E]
    set timlo [mem8 0xDB5E]
    set timhi [mem8 0xDB7E]
    logline [format "%s pc=%04X exit=%02X activeN=%02X list0=%02X list1=%02X profExec=%04X profSM=%04X ac=%02X ae=%02X aew=%02X dialog=%02X text=%02X screen=%02X eng=%02X smptr=%02X%02X smt=%02X%02X" $tag [reg PC] [mem8 0xC11E] [mem8 0xD91D] [mem8 0xD91E] [mem8 0xD91F] [mem16seq 0xC323] [mem16seq 0xC325] [mem8 0xC0E7] [mem8 0xC0F3] [mem8 0xC0F4] [mem8 0xC0F7] [mem8 0xC0F9] [mem8 0xDF7D] [mem8 0xDF7E] $ptrhi $ptrlo $timhi $timlo]
}
proc space_down {} { catch {keymatrixdown 8 1}; catch {keymatrixdown SPACE} }
proc space_up {} { catch {keymatrixup 8 1}; catch {keymatrixup SPACE} }
proc tap_space {tag} { state ${tag}_before; space_down; after time 0.35 { space_up }; after time 0.55 [list state ${tag}_after] }
proc force_done {tag} { debug write memory 0xC11F 4; state ${tag}_forced_done; tap_space $tag }
for {set i 1} {$i <= 55} {incr i} { after time [expr {$i * 1.0}] [list state "t${i}"] }
after time 6.0 { force_done "controls_done1" }
after time 8.0 { force_done "controls_done2" }
foreach t {20 24 28 32 36 40} { after time $t [list tap_space "dialog_space$t"] }
after time 54.0 { close $f; exit }
