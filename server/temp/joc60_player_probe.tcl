set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc60_player_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc60_player_probe_shots"
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

proc ent {base index} {
    return [mem8 [expr {$base + $index}]]
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC11B]
    set p2 [mem8 0xC11C]
    set p3 [mem8 0xC11D]
    set flow [mem8 0xC104]
    set screen [mem8 0xDF9D]
    set engine [mem8 0xDF9E]
    set screenEntities [mem8 0xDFA4]
    set activeCount [mem8 0xE51C]
    set inputCount [mem8 0xE53F]
    set renderCount [mem8 0xE560]
    set hero [mem8 0xE51D]
    set prt [mem8 0xDFAB]
    set pei [mem8 0xDFAC]
    set px [mem16 0xDFA7]
    set py [mem16 0xDFA9]
    set e0a [ent 0xD774 0]
    set e0p [ent 0xD794 0]
    set e0s [ent 0xDA14 0]
    set e0x [ent 0xD954 0]
    set e0y [ent 0xD974 0]
    set e0spr [ent 0xDDB5 0]
    set e0cfg [ent 0xDDD5 0]
    set e1a [ent 0xD774 1]
    set e1p [ent 0xD794 1]
    set e1s [ent 0xDA14 1]
    set e1x [ent 0xD954 1]
    set e1y [ent 0xD974 1]
    logline [format "%s pc=%04X sp=%04X banks=%02X/%02X/%02X flow=%02X screen=%02X engine=%02X screenEnt=%02X active=%02X input=%02X render=%02X hero=%02X prt=%02X pei=%02X pxy=%d,%d e0=a%02X p%02X s%02X xy%d,%d spr%02X cfg%02X e1=a%02X p%02X s%02X xy%d,%d" $tag $pc $sp $p1 $p2 $p3 $flow $screen $engine $screenEntities $activeCount $inputCount $renderCount $hero $prt $pei $px $py $e0a $e0p $e0s $e0x $e0y $e0spr $e0cfg $e1a $e1p $e1s $e1x $e1y]
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc hold {tag mask duration} {
    state ${tag}_before
    down $mask
    after time $duration [list release $tag $mask]
}

proc release {tag mask} {
    up $mask
    state ${tag}_after
}

proc tap_space {tag} {
    hold $tag 1 0.25
}

proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} {
        logline "SHOTERR $err"
    } else {
        logline "SHOTOK $name"
    }
}

debug set_bp 0x4010 {} {
    state "BP_4010"
    debug cont
}

debug set_bp 0x4F2D {} {
    state "BP_init_game_systems"
    debug cont
}

debug set_bp 0x49D0 {} {
    state "BP_init_entities_far"
    debug cont
}

debug set_bp 0x60C7 {} {
    state "BP_init_player_1"
    debug cont
}

debug set_bp 0x4ED8 {} {
    state "BP_call_create_entity_resident"
    debug cont
}

debug set_bp 0x74E0 {} {
    state "BP_create_entity"
    debug cont
}

after time 2.0  { state "t2" }
after time 7.0  { tap_space "space1" }
after time 9.0  { state "t9" }
after time 12.0 { tap_space "space2" }
after time 13.2 { shot "joc60_player_t13.png" "t13" }
after time 14.0 { hold "right" 128 1.0 }
after time 15.4 { shot "joc60_player_t15.png" "t15" }
after time 17.0 { state "t17"; close $f; exit }
