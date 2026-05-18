set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_matrix_megarom_konami_openmsx_smoke.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_matrix_megarom_konami_openmsx_smoke_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    set pc [reg PC]; set sp [reg SP]
    set p1 [mem8 0xC15A]; set p2 [mem8 0xC15B]; set p3 [mem8 0xC15C]; set p4 [mem8 0xC15D]
    set flow [mem8 0xC11C]; set screen [mem8 0xE314]; set irq [mem16 0xEA0F]; set inirq [mem8 0xEA14]
    set input [mem8 0xC000]; set btn [mem8 0xC002]
    set key8 [debug read keymatrix 8]; set joy [debug read joystickports 0]
    set ret [mem16 $sp]
    set pidx [mem8 0xE323]
    set hero [mem8 0xE92D]
    set prun [mem8 0xE322]
    set entx 65535
    set enty 65535
    set sprslot 255
    set sprx 65535
    set spry 65535
    set visbestslot 255
    set visbestx 65535
    set visbesty 65535
    for {set scan 0} {$scan < 32} {incr scan} {
        set scanaddr [expr {0xE294 + ($scan * 4)}]
        set scany [mem8 $scanaddr]
        set scanx [mem8 [expr {$scanaddr + 1}]]
        if {$scany < 208 && $scany > 32 && $scanx > 16} {
            if {$visbestslot == 255 || $scanx > $visbestx} {
                set visbestslot $scan
                set visbestx $scanx
                set visbesty $scany
            }
        }
    }
    if {$pidx < 32} {
        set entx [mem8 [expr {0xD9B7 + $pidx}]]
        set enty [mem8 [expr {0xD9D7 + $pidx}]]
        set sprslot [mem8 [expr {0xE0F8 + ($pidx * 2)}]]
        if {$sprslot < 32} {
            set spraddr [expr {0xE294 + ($sprslot * 4)}]
            set spry [mem8 $spraddr]
            set sprx [mem8 [expr {$spraddr + 1}]]
        }
    }
    set px [mem16 0xE31E]; set py [mem16 0xE320]
    logline [format "%s pc=%04X sp=%04X ret=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X inirq=%02X input=%02X btn=%02X key8=%02X joy=%02X pidx=%02X hero=%02X prun=%02X ent=%d,%d sprslot=%02X spr=%d,%d visbest=%02X,%d,%d pos=%d,%d" $tag $pc $sp $ret $p1 $p2 $p3 $p4 $flow $screen $irq $inirq $input $btn $key8 $joy $pidx $hero $prun $entx $enty $sprslot $sprx $spry $visbestslot $visbestx $visbesty $px $py]
}
proc down_space {} { keymatrixdown 8 0x01 }
proc up_space {} { keymatrixup 8 0x01 }
proc down_right {} { keymatrixdown 8 0x80 }
proc up_right {} { keymatrixup 8 0x80 }
proc down_left {} { keymatrixdown 8 0x10 }
proc up_left {} { keymatrixup 8 0x10 }
proc tap_space {tag} { state "${tag}_before"; down_space; after time 0.12 [list state "${tag}_during"]; after time 0.35 up_space; after time 0.45 [list state "${tag}_after"] }
proc hold_right {tag duration} { state "${tag}_before"; down_right; after time 0.25 [list state "${tag}_during"]; after time $duration up_right; after time [expr {$duration + 0.05}] [list state "${tag}_after"] }
proc hold_left {tag duration} { state "${tag}_before"; down_left; after time 0.25 [list state "${tag}_during"]; after time $duration up_left; after time [expr {$duration + 0.05}] [list state "${tag}_after"] }
proc gameplay_ready {} {
    global task_input_hits
    set px [mem16 0xE31E]
    set py [mem16 0xE320]
    return [expr {$task_input_hits > 0 && $px != 0x3333 && $py != 0x3333}]
}
proc hold_right_when_ready {tag duration remaining} {
    if {[gameplay_ready]} {
        hold_right $tag $duration
    } elseif {$remaining <= 0} {
        state "${tag}_not_ready"
    } else {
        after time 0.5 [list hold_right_when_ready $tag $duration [expr {$remaining - 1}]]
    }
}
proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} { logline "SHOTERR $err" } else { logline "SHOTOK $name" }
}

debug set_bp 0x4010 {} { state "BP_4010"; debug cont }
set task_input_hits 0
debug set_bp 0x4B10 {} {
    global task_input_hits
    incr task_input_hits
    if {$task_input_hits <= 2 || [debug read keymatrix 8] != 0xFF} {
        state "BP_task_input_$task_input_hits"
    }
    debug cont
}

after time 7.0 { tap_space "space1" }
after time 9.0 { tap_space "space2" }
after time 12.0 { shot "patoantic248_matrix_megarom_konami_t12.png" "t12" }
after time 12.8 { tap_space "space3" }
after time 14.0 { hold_right_when_ready "right" 1.0 18 }
after time 16.0 { shot "patoantic248_matrix_megarom_konami_t16.png" "t16" }
after time 17.0 { hold_left "left" 1.0 }
after time 22.0 { shot "patoantic248_matrix_megarom_konami_t22.png" "t22"; close $f; exit }
