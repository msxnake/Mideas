set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas116_dialog_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas116_dialog_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr+1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set pc [reg PC]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set flow [mem8 0xC11C]
    set exit [mem8 0xC11E]
    set reveal [mem8 0xC127]
    set did [mem8 0xC0F7]
    set dtxt [mem8 0xC0F9]
    set screen [mem8 0xDF7D]
    set engine [mem8 0xDF7E]
    set world [mem8 0xDF81]
    set sidx [mem8 0xDF82]
    set prun [mem8 0xDF8B]
    set pidx [mem8 0xDF8C]
    set px [mem16 0xDF87]
    set py [mem16 0xDF89]
    logline [format "%s pc=%04X bank=%02X/%02X/%02X flow=%02X exit=%02X reveal=%02X dialog=%02X text=%02X screen=%02X engine=%02X world=%02X idx=%02X playerRun=%02X pidx=%02X pxy=%d,%d" $tag $pc $p1 $p2 $p3 $flow $exit $reveal $did $dtxt $screen $engine $world $sidx $prun $pidx $px $py]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state ${tag}_before; down 1; after time 0.18 [list up 1]; after time 0.25 [list state ${tag}_after] }
proc shot {name tag} { global shot_dir; state $tag; catch {screenshot "$shot_dir/$name"} err; logline "SHOT $name $err" }
for {set i 1} {$i <= 55} {incr i} { after time [expr {$i * 1.0}] [list state "t${i}"] }
foreach t {2 4 6 8 10 12 14 16 18 20 22 24 26 28 30 32 34 36 38 40 42 44 46 48 50} { after time $t [list tap_space "spc$t"] }
after time 6 { shot "t06.png" "shot_t06" }
after time 14 { shot "t14.png" "shot_t14" }
after time 24 { shot "t24.png" "shot_t24" }
after time 34 { shot "t34.png" "shot_t34" }
after time 46 { shot "t46.png" "shot_t46" }
after time 55 { shot "t55.png" "shot_t55"; close $f; exit }
