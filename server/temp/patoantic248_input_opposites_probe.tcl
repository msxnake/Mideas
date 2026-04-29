set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_input_opposites_probe.log"
set f [open $log_path "w"]
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set pc [reg PC]; set sp [reg SP]
    set p1 [mem8 0xC053]; set p2 [mem8 0xC054]; set p3 [mem8 0xC055]
    set flow [mem8 0xC03B]; set screen [mem8 0xE531]
    set input [mem8 0xC000]; set player [mem8 0xE540]
    set px [mem16 0xE53B]; set py [mem16 0xE53D]
    set vx [mem8 0xE541]; set vy [mem8 0xE542]
    logline [format "%s pc=%04X sp=%04X p=%02X/%02X/%02X flow=%02X screen=%02X in=%02X player=%02X pxy=%d,%d v=%02X/%02X" $tag $pc $sp $p1 $p2 $p3 $flow $screen $input $player $px $py $vx $vy]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc hold {tag masks duration} {
    state ${tag}_before
    foreach m $masks { down $m }
    after time 0.35 [list state ${tag}_during]
    after time $duration [list release $tag $masks]
}
proc release {tag masks} { foreach m $masks { up $m }; state ${tag}_after }
proc tap_space {tag} { hold $tag {1} 0.22 }

debug set_bp 0x4010 {} { state "BP_4010_RESET_OR_INIT"; debug cont }

after time 7.0 { tap_space "intro" }
after time 12.0 { tap_space "start" }
after time 13.2 { state "game_start" }
after time 14.0 { hold "RIGHT" {128} 0.8 }
after time 15.2 { hold "UP_RIGHT" {32 128} 0.8 }
after time 16.4 { hold "UP_DOWN" {32 64} 0.8 }
after time 17.6 { hold "LEFT_RIGHT" {16 128} 0.8 }
after time 18.8 { hold "ALL_DIRS" {32 64 16 128} 0.8 }
after time 20.2 { state "final"; catch {screenshot "$shot_dir/patoantic248_input_opposites_final.png"}; close $f; exit }
