set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_48k_slot_trace.log" "w"]

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

proc regs {tag} {
    foreach r {PC SP AF BC DE HL IX IY} {
        if {[catch {reg $r} v]} { set v "ERR" }
        append line "$r=$v "
    }
    log "$tag $line ffff=[mem8 65535] romslot=[mem8 49429] primary=[mem8 49430] bios0=[mem8 49431] page2=[mem8 49432] page3=[mem8 49433] flow=[mem8 49412] screen=[mem8 57063]"
}

regs "start"

debug set_bp 0x9B96 {} {
    regs "bp_map_entry"
    debug cont
}

debug set_bp 0x9BB1 {} {
    regs "bp_map_before_out"
    debug cont
}

debug set_bp 0x9BB3 {} {
    regs "bp_map_after_out"
    debug cont
}

debug set_bp 0x9BB6 {} {
    regs "bp_write_subslot"
    debug cont
}

debug set_bp 0x9BBA {} {
    regs "bp_after_subslot_write"
    debug cont
}

debug set_bp 0x9BBB {} {
    regs "bp_map_game_rom"
    debug cont
}

debug set_bp 0x9BC2 {} {
    regs "bp_restore"
    debug cont
}

after time 4.0 { regs "t4" }
after time 7.0 { keymatrixdown 8 1 }
after time 7.2 { keymatrixup 8 1; regs "space1" }
after time 8.5 { regs "t85"; close $f; exit }
