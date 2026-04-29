set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_music_only_irq_probe.log"
set f [open $log_path "w"]
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set flow [mem8 0xC03B]
    set exit [mem8 0xC03D]
    set screen [mem8 0xDF3D]
    set input [mem8 0xC000]
    set btn [mem8 0xC002]
    set irq [mem16 0xE595]
    set inirq [mem8 0xE59A]
    set music [mem8 0xE59F]
    set loop [mem8 0xE5A1]
    set frames [mem8 0xE5A3]
    set cd [mem8 0xE5A4]
    set prof [mem16 0xC080]
    set player [mem8 0xDF47]
    set px [mem16 [expr {0xD89B + ($player * 2)}]]
    set py [mem16 [expr {0xD8BB + ($player * 2)}]]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X flow=%02X exit=%02X screen=%02X in=%02X btn=%02X irq=%04X inirq=%02X music=%02X loop=%02X frames=%02X cd=%02X prof=%04X player=%02X pxy=%d,%d" $tag $pc $sp $p1 $p2 $p3 $flow $exit $screen $input $btn $irq $inirq $music $loop $frames $cd $prof $player $px $py]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc release {tag masks} {
    foreach m $masks { up $m }
    state ${tag}_after
}
proc hold {tag masks duration} {
    state ${tag}_before
    foreach m $masks { down $m }
    after time 0.35 [list state ${tag}_during]
    after time $duration [list release $tag $masks]
}
proc tap_space {tag} { hold $tag {1} 0.25 }
proc shot {name tag} {
    global shot_dir
    state $tag
    catch {screenshot "$shot_dir/$name"}
}

debug set_bp 0x4010 {} {
    state "BP_4010_RESET_OR_INIT"
    debug cont
}
debug set_bp 0x0000 {} {
    state "BP_0000"
    debug cont
}

state "boot"

after realtime 5.0  { state "real_05" }
after realtime 10.0 { state "real_10" }
after realtime 15.0 { state "real_15" }
after realtime 20.0 { state "real_20" }
after realtime 25.0 { state "real_25" }
after realtime 30.0 { state "real_30" }
after realtime 40.0 { state "real_40" }
after realtime 50.0 { state "real_50" }
after realtime 60.0 { state "real_60" }
after realtime 70.0 { state "real_70" }
after realtime 80.0 { state "real_80" }
after realtime 90.0 {
    state "real_timeout_90"
    close $f
    exit
}

after time 7.0  { tap_space "intro" }
after time 12.0 { tap_space "start" }
after time 13.2 { shot "patoantic248_music_only_irq_game_start.png" "game_start" }
after time 15.0 { state "emu_15" }
after time 18.0 { state "emu_18" }
after time 21.0 { state "emu_21" }
after time 24.0 { hold "RIGHT" {128} 1.0 }
after time 27.0 { state "after_right_27" }
after time 30.0 { hold "UP_RIGHT" {32 128} 1.0 }
after time 33.0 { state "after_upright_33" }
after time 36.0 { hold "LEFT" {16} 1.0 }
after time 39.0 { state "after_left_39" }
after time 42.0 { shot "patoantic248_music_only_irq_42s.png" "shot_42" }
after time 48.0 { state "emu_48" }
after time 54.0 { shot "patoantic248_music_only_irq_54s.png" "shot_54" }
after time 60.0 {
    state "final_60"
    close $f
    exit
}
