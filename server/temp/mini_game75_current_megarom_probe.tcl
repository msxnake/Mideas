set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/mini_game75_current_megarom_probe.log"
set f [open $log_path "w"]
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
set probe_key 0
set probe_hits 0

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
    set p1 [mem8 0xC04C]
    set p2 [mem8 0xC04D]
    set p3 [mem8 0xC04E]
    set p4 [mem8 0xC04F]
    set flow [mem8 0xC03B]
    set exit [mem8 0xC03D]
    set screen [mem8 0xDEFE]
    set input [mem8 0xC000]
    set btn [mem8 0xC002]
    set player [mem8 0xDF08]
    set px [mem16 0xD88C]
    set py [mem16 0xD8AC]
    set music [mem8 0xE560]
    set muted [mem8 0xE561]
    set loop [mem8 0xE562]
    set row_frames [mem8 0xE565]
    set countdown [mem8 0xE566]
    set order [mem8 0xE567]
    set pattern [mem8 0xE568]
    set row [mem8 0xE569]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X/%02X flow=%02X exit=%02X screen=%02X in=%02X btn=%02X player=%02X pxy=%d,%d music=%02X muted=%02X loop=%02X ord=%02X pat=%02X row=%02X frames=%02X cd=%02X" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $exit $screen $input $btn $player $px $py $music $muted $loop $order $pattern $row $row_frames $countdown]
}

debug set_bp 0xA527 {} {
    global probe_hits
    if {$probe_hits < 20} {
        incr probe_hits
        logline [format "confirm_probe hit=%d A_after_FAST_SNSMAT=%02X pc=%04X" $probe_hits [reg A] [reg PC]]
    }
    debug cont
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
    after time 0.20 [list state ${tag}_during]
    after time $duration [list release $tag $masks]
}

after time 2.0 { state boot_2s }
after time 7.0 { global probe_key; set probe_key 1; state intro_space_before; keymatrixdown 8 1 }
after time 7.25 { keymatrixup 8 1; global probe_key; set probe_key 0; state intro_space_after }
after time 10.0 { state after_intro }
after time 13.2 { state menu_13s }
after time 15.0 { state start_space_before; keymatrixdown 8 1 }
after time 15.35 { keymatrixup 8 1; state start_space_after }
after time 17.0 { state history_text }
after time 18.0 { state continue_space_before; keymatrixdown 8 1 }
after time 18.35 { keymatrixup 8 1; state continue_space_after }
after time 20.0 { state game_20s }
after time 21.0 { state idle_21s }
after time 22.0 { state idle_22s }
after time 23.0 { state game_23s }
after time 23.5 {
    global shot_dir
    screenshot "$shot_dir/mini_game75_current_megarom_probe.png"
}
after time 24.0 { state final }
after time 24.3 { 
    global f
    close $f
    exit
}
