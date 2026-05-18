set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_story_timeline.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/galious_story_shots"
file mkdir $shot_dir
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc peek_vram {addr} {
    if {[catch {debug read "VRAM" $addr} v]} { return -1 }
    return $v
}
proc sample {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set r2 [vdpreg 2]
    set r3 [vdpreg 3]
    set r4 [vdpreg 4]
    set r7 [vdpreg 7]
    set nt0 [peek_vram 0x1800]
    set ntb [peek_vram 0x1B80]
    set pt0 [peek_vram 0x0000]
    set pt1 [peek_vram 0x0800]
    set pt2 [peek_vram 0x1000]
    logline [format "%s pc=%04X sp=%04X r2=%02X r3=%02X r4=%02X r7=%02X nt1800=%02X nt1B80=%02X pt=%02X/%02X/%02X" $tag $pc $sp $r2 $r3 $r4 $r7 $nt0 $ntb $pt0 $pt1 $pt2]
}
proc shot {sec} {
    global shot_dir
    sample "SHOT_$sec"
    if {[catch {screenshot "$shot_dir/galious_story_t${sec}.png"} err]} { logline "SHOTERR $err" }
}
for {set t 60} {$t <= 105} {incr t} { after time $t [list shot $t] }
after time 107 { logline "DONE"; close $f; exit }
