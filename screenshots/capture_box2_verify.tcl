# Box2 verification: idle -> push (sprite) -> release (chars must reappear immediately)
set ss_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
set log_path "$ss_dir/MyMSXGame1_box2_log.txt"

set lf [open $log_path "w"]
puts $lf "=== Box2 Char Redraw Verification ==="
puts $lf "Probes: msx2_box2_moving_slot=#C04C, runtime_x=#C04F"
close $lf

proc log_msg {msg} {
    global log_path
    set lf [open $log_path "a"]
    puts $lf $msg
    close $lf
    puts $msg
}

proc probe_box2 {label} {
    if {[catch {
        set ms [debug read memory 0xC04C]
        set rx [debug read memory 0xC04F]
        set mm [debug read memory 0xC04E]
        set px [debug read memory 0xC040]
        log_msg "\[$label\] player_x(0xC040)=[format 0x%02X $px]($px)  moving_slot(0xC04C)=[format 0x%02X $ms]($ms)  move_mode(0xC04E)=[format 0x%02X $mm]($mm)  box_x(0xC04F)=[format 0x%02X $rx]($rx)"
    } err]} {
        log_msg "\[$label\] probe_error=$err"
    }
}

proc snap {name} {
    global ss_dir
    set path "$ss_dir/${name}.png"
    set r [catch {screenshot $path} out]
    log_msg "SHOT $name rc=$r path=$path out=$out"
}

# Boot -> menu -> game
after time 5.0 { keymatrixdown 8 1 }
after time 5.2 { keymatrixup 8 1 }
after time 6.0 { keymatrixdown 8 1 }
after time 6.2 { keymatrixup 8 1 }
after time 7.0 { keymatrixdown 8 1 }
after time 7.2 { keymatrixup 8 1 }

after time 9.0 {
    log_msg ""
    log_msg "--- T=8.0s: IDLE (chars visible) ---"
    probe_box2 "IDLE"
    snap "box2_01_idle"
}

after time 9.200 {
    keymatrixdown 8 128
    log_msg ""
    log_msg "--- T=8.2s: RIGHT down ---"
}

after time 11.500 {
    log_msg ""
    log_msg "--- T=9.5s: HOLDING RIGHT ---"
    probe_box2 "PUSHING"
    snap "box2_02_pushing"
}

after time 12.000 {
    keymatrixup 8 128
    log_msg ""
    log_msg "--- T=10.0s: RIGHT released ---"
}

after time 12.200 {
    log_msg ""
    log_msg "--- T=10.2s: AFTER RELEASE (+200ms) ---"
    probe_box2 "AFTER_RELEASE"
    snap "box2_03_after_release"
}

after time 12.400 {
    log_msg ""
    log_msg "--- T=10.4s: AFTER RELEASE (+400ms) ---"
    probe_box2 "SETTLED"
    snap "box2_04_settled"
    log_msg ""
    log_msg "=== Box2 verification complete ==="
    after time 0.5 { exit }
}
