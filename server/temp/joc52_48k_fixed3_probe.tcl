set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_48k_fixed3_probe.log" "w"]
file mkdir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_48k_fixed3_shots"

proc log {msg} {
    global f
    puts $f $msg
    flush $f
}

proc mem8 {addr} {
    if {[catch {debug read memory $addr} v]} {
        return "ERR"
    }
    return $v
}

proc state {tag} {
    if {[catch {reg PC} pc]} { set pc "ERR" }
    if {[catch {reg SP} sp]} { set sp "ERR" }
    log "$tag pc=$pc sp=$sp romslot=[mem8 49429] primary=[mem8 49430] bios0=[mem8 49431] page3=[mem8 49433] flow=[mem8 49412] exit=[mem8 49414] screen=[mem8 57063]"
}

proc shot {name tag} {
    state $tag
    if {[catch {screenshot "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_48k_fixed3_shots/$name"} err]} {
        log "shot $name ERR $err"
    } else {
        log "shot $name OK"
    }
}

debug set_bp 0x9BE8 {} {
    state "bp_page0_map_game_rom"
    debug cont
}

debug set_bp 0x9BEF {} {
    state "bp_page0_restore_bios_rom"
    debug cont
}

debug set_bp 0x9C3A {} {
    state "bp_page0_copy_to_ram"
    debug cont
}

state "start"
after time 1.0 { shot "t01_boot.png" "t1" }
after time 4.0 { shot "t04_title.png" "t4" }
after time 7.0 { keymatrixdown 8 1 }
after time 7.2 { keymatrixup 8 1; shot "t07_space1.png" "space1" }
after time 10.0 { shot "t10_after_space1.png" "t10" }
after time 12.0 { keymatrixdown 8 1 }
after time 12.2 { keymatrixup 8 1; shot "t12_space2.png" "space2" }
after time 16.0 { shot "t16_late.png" "done"; close $f; exit }
