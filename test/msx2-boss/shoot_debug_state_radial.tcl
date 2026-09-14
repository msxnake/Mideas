# Debug state logger: sample boss/fire state once per second.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/shoot_debug_state_radial.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

proc symval {label} {
    set sym_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/shoot_radial_fresh.sym"
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
set P_WAIT  [symval boss_path_wait]
set P_CUR   [symval boss_path_cur]
set INTRO   [symval boss_intro_state]
set ITICK   [symval boss_int_tick]
set PPTR    [symval boss_path_ptr]

foreach t {6 8 10} {
    after time $t     "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
set n 0
proc tick {} {
    global n POOL BOSS_ACT BOSS_X BOSS_Y PLR_X PLR_Y CD SHOOT_CNT P_IDX P_FIRE BURST
    incr n
    set cur [expr {[mem8 [expr {$P_CUR}]] + 256*[mem8 [expr {$P_CUR+1}]]}]
    set ptr [expr {[mem8 [expr {$PPTR}]] + 256*[mem8 [expr {$PPTR+1}]]}]
    logline "t=${n}s boss_act=[mem8 $BOSS_ACT] intro=[mem8 $INTRO] boss=([mem8 $BOSS_X],[mem8 $BOSS_Y]) wait=[mem8 $P_WAIT] cur=# [format %04X $cur] ptr=# [format %04X $ptr] itick=[mem8 $ITICK] cd=[mem8 $CD] shoot_cnt=[mem8 $SHOOT_CNT] path_idx=[mem8 $P_IDX] fire_mode=[mem8 $P_FIRE] burst=[mem8 $BURST] pool0=[mem8 $POOL]"
    after time 1 tick
}
tick
after time 30 {
    close $f
    after time 1 { exit }
}
