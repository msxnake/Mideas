set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/tales7_no_romtype.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/tales7_no_romtype_shots"
file mkdir $shot_dir
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc state {tag} { set pc [reg PC]; set sp [reg SP]; set p1 [mem8 0xC053]; set p2 [mem8 0xC054]; set p3 [mem8 0xC055]; logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X" $tag $pc $sp $p1 $p2 $p3] }
proc shot {name tag} { global shot_dir; state $tag; if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $err" } else { logline "SHOTOK $name" } }
after time 1.0 { shot "tales7_no_romtype_t1.png" "t1" }
after time 3.0 { shot "tales7_no_romtype_t3.png" "t3" }
after time 6.0 { shot "tales7_no_romtype_t6.png" "t6"; close $f; exit }
