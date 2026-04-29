set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_stress_cursors_probe.log"
set f [open $log_path "w"]
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
proc press {tag masks hold} { state ${tag}_before; foreach m $masks { down $m }; after time $hold [list release $tag $masks] }
proc release {tag masks} { foreach m $masks { up $m }; state ${tag}_after }
proc tap_space {tag} { press $tag {1} 0.22 }

debug set_bp 0x0000 {} { state "BP_0000"; debug cont }
debug set_bp 0x4010 {} { state "BP_4010_RESET_OR_INIT"; debug cont }

after time 7.0 { tap_space "intro" }
after time 12.0 { tap_space "start" }
set t 13.5
set seq {
    {128} {32 128} {128} {64 128} {16} {64 16} {32 16} {32 64} {16 128} {32 64 16 128}
    {128} {128} {32 128} {64 16} {16} {32 16} {128} {64 128} {32 64} {16 128}
    {32 128} {32 128} {64 16} {64 16} {128} {16} {32 64 16 128} {128} {32 128} {64 128}
}
set i 0
foreach masks $seq {
    set tag [format "step_%02d" $i]
    after time $t [list press $tag $masks 0.65]
    set t [expr {$t + 0.95}]
    incr i
}
after time 45.0 { state "checkpoint_45" }
after time 60.0 { state "final_60"; close $f; exit }
