# Debug state logger: sample boss/fire state once per second.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/shoot_debug_state.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

proc symval {label} {
    set sym_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/shoot_aimed.sym"
    set fh [open $sym_path r]
    set data [read $fh]
    close $fh
    foreach line [split $data "\n"] {
        if {[string match "$label: equ *" $line]} {
            if {[regexp {equ\s+([0-9A-Fa-f]+)H} $line -> hex]} {
                return [expr {"0x$hex"}]
            }
        }
    }
    error "symbol $label not found"
}

proc mem8 {addr} { return [debug read memory $addr] }

set POOL    [symval boss_sbul_pool]
set BOSS_ACT [symval boss_active]
set BOSS_X  [symval boss_x]
set BOSS_Y  [symval boss_y]
set PLR_X   [symval player_x]
set PLR_Y   [symval player_y]
set CD      [symval boss_proj_cd]
set SHOOT_CNT [symval boss_shoot_cnt]
set P_IDX   [symval boss_path_idx]
set P_FIRE  [symval boss_path_fire_mode]
set BURST   [symval boss_burst_idx]

set n 0
proc tick {} {
    global n POOL BOSS_ACT BOSS_X BOSS_Y PLR_X PLR_Y CD SHOOT_CNT P_IDX P_FIRE BURST
    incr n
    logline "t=${n}s boss_act=[mem8 $BOSS_ACT] boss=([mem8 $BOSS_X],[mem8 $BOSS_Y]) player=([mem8 $PLR_X],[mem8 $PLR_Y]) cd=[mem8 $CD] shoot_cnt=[mem8 $SHOOT_CNT] path_idx=[mem8 $P_IDX] fire_mode=[mem8 $P_FIRE] burst=[mem8 $BURST] pool0=[mem8 $POOL] slot0v=([mem8 [expr {$POOL+3}]],[mem8 [expr {$POOL+4}]])"
    after time 1 tick
}
tick
after time 30 {
    close $f
    after time 1 { exit }
}
