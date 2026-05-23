set out_dir "C:/Users/salam/Documents/Programacion/Mideas/research/vampire_killer_openmsx"
file mkdir $out_dir
set f [open "$out_dir/probe_runtime_objects.log" "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc state {tag} {
    logline [format "%s PC=%04X SP=%04X AF=%04X BC=%04X DE=%04X HL=%04X IX=%04X IY=%04X" $tag [reg PC] [reg SP] [reg AF] [reg BC] [reg DE] [reg HL] [reg IX] [reg IY]]
}

set ::c4_count 0
set ::e0_count 0

after time 10.5 { keymatrixdown 8 1; logline "INPUT SPACE DOWN" }
after time 10.7 { keymatrixup 8 1; logline "INPUT SPACE UP" }

after time 18.0 {
    logline "SET_RUNTIME_WATCHPOINTS"
    debug set_watchpoint write_mem {0xC400 0xC4BF} {} {
        incr ::c4_count
        if {$::c4_count <= 160} {
            state [format "C4W_%03d_ADDR_%04X_VAL_%02X" $::c4_count $::wp_last_address $::wp_last_value]
        }
        debug cont
    }
    debug set_watchpoint write_mem {0xE000 0xE0BF} {} {
        incr ::e0_count
        if {$::e0_count <= 80} {
            state [format "E0W_%03d_ADDR_%04X_VAL_%02X" $::e0_count $::wp_last_address $::wp_last_value]
        }
        debug cont
    }
}

after time 19.0 { keymatrixdown 8 128; logline "INPUT RIGHT DOWN" }
after time 21.0 { keymatrixup 8 128; logline "INPUT RIGHT UP" }

after time 23.0 {
    screenshot "$out_dir/runtime_objects_23s.png"
    logline [format "COUNTS c4=%d e0=%d" $::c4_count $::e0_count]
    close $::f
    exit
}
