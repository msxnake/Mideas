set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/pato_ascii16_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/pato_ascii16_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

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
    set p1 [mem8 0xC11D]
    set p2 [mem8 0xC11E]
    set p3 [mem8 0xC11F]
    set p4 [mem8 0xC120]
    set flow [mem8 0xC104]
    set screen [mem8 0xE187]
    set px [mem16 0xE191]
    set py [mem16 0xE193]
    set pen [mem8 0xE195]
    set pei [mem8 0xE196]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X player=%02X/%02X pxy=%d,%d" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $pen $pei $px $py]
}

proc bpstate {tag} {
    state $tag
    debug cont
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} {
    state "${tag}_before"
    down 1
    after time 0.20 [list up 1]
    after time 0.25 [list state "${tag}_after"]
}

proc shot {name tag} {
    global shot_dir
    state $tag
    screenshot "$shot_dir/$name"
}

debug set_bp 0x4010 {} { bpstate "BP_4010" }
debug set_bp 0x6008 {} { bpstate "BP_gameflow_start" }
debug set_bp 0x6010 {} { bpstate "BP_gameflow_execute_node" }
debug set_bp 0x6482 {} { bpstate "BP_handle_start" }
debug set_bp 0x6590 {} { bpstate "BP_handle_presentation" }
debug set_bp 0x4E4F {} { bpstate "BP_show_presentation_far" }
debug set_bp 0x6B55 {} { bpstate "BP_gameflow_show_stub" }
debug set_bp 0x6047 {} { bpstate "BP_show_presentation_image" }
debug set_bp 0x5593 {} { bpstate "BP_init_game_systems" }
debug set_bp 0x6732 {} { bpstate "BP_world_loop" }

after time 1.0 { state "t1" }
after time 3.0 { state "t3" }
after time 6.5 { shot "t65.png" "t65" }
after time 7.0 { tap_space "space1" }
after time 9.0 { state "t9" }
after time 12.0 { tap_space "space2" }
after time 13.5 { shot "t135.png" "t135" }
after time 18.0 { shot "t18.png" "t18"; close $f; exit }
