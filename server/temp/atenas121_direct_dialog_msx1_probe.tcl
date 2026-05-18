set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas121_direct_dialog_msx1_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas121_direct_dialog_msx1_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc state {tag} {
    logline [format "%s pc=%04X exit=%02X dialog=%02X text=%02X screen=%02X engine=%02X world=%02X" $tag [reg PC] [mem8 0xC11E] [mem8 0xC0F7] [mem8 0xC0F9] [mem8 0xDF7D] [mem8 0xDF7E] [mem8 0xDF81]]
}
proc shot {name tag} {
    global shot_dir
    state $tag
    screenshot "$shot_dir/$name"
    logline "SHOTOK $name"
}

after time 8.0 { shot "t08.png" "shot_t08" }
after time 14.0 { shot "t14.png" "shot_t14" }
after time 22.0 { shot "t22.png" "shot_t22"; close $f; exit }
