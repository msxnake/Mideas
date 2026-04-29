set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_real_cursors_reset_probe.log"
set f [open $log_path "w"]
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set pc [reg PC]; set sp [reg SP]
    set p1 [mem8 0xC053]; set p2 [mem8 0xC054]; set p3 [mem8 0xC055]
    set flow [mem8 0xC03B]; set screen [mem8 0xE531]
    set input [mem8 0xC000]; set prev [mem8 0xC001]; set btn [mem8 0xC002]
    set player [mem8 0xE540]; set px [mem16 0xE53B]; set py [mem16 0xE53D]
    set vx [mem8 0xE541]; set vy [mem8 0xE542]
    logline [format "%s pc=%04X sp=%04X p=%02X/%02X/%02X flow=%02X screen=%02X in=%02X prev=%02X btn=%02X player=%02X pxy=%d,%d v=%02X/%02X" $tag $pc $sp $p1 $p2 $p3 $flow $screen $input $prev $btn $player $px $py $vx $vy]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state ${tag}_before; down 1; after time 0.22 {up 1} }
proc combo {tag masks hold} { state ${tag}_before; foreach m $masks { down $m }; after time $hold [list combo_up $tag $masks] }
proc combo_up {tag masks} { foreach m $masks { up $m }; state ${tag}_afterup }
proc shot {name tag} { global shot_dir; state $tag; if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $err" } else { logline "SHOTOK $name" } }

debug set_bp 0x0000 {} { state "BP_0000"; debug cont }
debug set_bp 0x4010 {} { state "BP_4010_RESET_OR_INIT"; debug cont }

after time 7.0 { tap_space "intro" }
after time 12.0 { tap_space "start" }
after time 13.2 { shot "patoantic248_real_cursors_start.png" "game_start" }
after time 14.0 { combo "RIGHT" {128} 0.7 }
after time 15.0 { shot "patoantic248_real_cursors_after_right.png" "after_right" }
after time 15.4 { combo "UP_RIGHT" {32 128} 1.0 }
after time 16.8 { shot "patoantic248_real_cursors_after_upright.png" "after_upright" }
after time 17.2 { combo "DOWN_LEFT" {64 16} 1.0 }
after time 18.6 { shot "patoantic248_real_cursors_after_downleft.png" "after_downleft" }
after time 19.0 { combo "UP_DOWN" {32 64} 0.8 }
after time 20.1 { shot "patoantic248_real_cursors_after_updown.png" "after_updown" }
after time 20.5 { combo "LEFT_RIGHT" {16 128} 0.8 }
after time 21.6 { shot "patoantic248_real_cursors_after_leftright.png" "after_leftright" }
after time 22.0 { combo "ALL_DIRS" {32 64 16 128} 0.8 }
after time 23.2 { shot "patoantic248_real_cursors_final.png" "final"; close $f; exit }
