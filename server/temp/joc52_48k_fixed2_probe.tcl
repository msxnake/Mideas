set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_48k_fixed2_probe.log" "w"]

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

debug set_bp 0x9BDC {} {
    state "bp_page0_map_game_rom"
    debug cont
}

debug set_bp 0x9BE3 {} {
    state "bp_page0_restore_bios_rom"
    debug cont
}

debug set_bp 0x9C2E {} {
    state "bp_page0_copy_to_ram"
    debug cont
}

state "start"
after time 1.0 { state "t1" }
after time 4.0 { state "t4" }
after time 7.0 { keymatrixdown 8 1 }
after time 7.2 { keymatrixup 8 1; state "space1" }
after time 10.0 { state "t10" }
after time 12.0 { keymatrixdown 8 1 }
after time 12.2 { keymatrixup 8 1; state "space2" }
after time 16.0 { state "done"; close $f; exit }
