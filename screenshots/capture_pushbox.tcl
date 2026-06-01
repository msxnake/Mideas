# Push Box Defer-Char-Tiles - 3-screenshot verification v4
# SS3 at T=9.72s (0.12s after release) - before game-end event at ~9.85s

set log_path "C:/Users/salam/Documents/openMSX/screenshots/MyMSXGame1_40_log.txt"

set lf [open $log_path "w"]
puts $lf "=== Push Box Defer-Char-Tiles Verification v4 ==="
puts $lf "ROM: MyMSXGame1_40.rom (Konami MegaROM, MSX2 SCREEN 4)"
puts $lf "------------------------------------------------------"
close $lf

proc log_msg {msg} {
    global log_path
    set lf [open $log_path "a"]
    puts $lf $msg
    close $lf
    puts $msg
}

proc probe_ram {label} {
    set rx [debug read memory 0xC04F]
    set ds [debug read memory 0xC077]
    set ms [debug read memory 0xC04C]
    log_msg "\[$label\] msx2_push_box_runtime_x(0xC04F)=[format 0x%02X $rx]($rx)  defer_char_slot(0xC077)=[format 0x%02X $ds]($ds)  moving_slot(0xC04C)=[format 0x%02X $ms]($ms)"
}

# T=7.0s: Screenshot 1 - IDLE (box as 2x2 char tiles)
after time 7.000 {
    log_msg ""
    log_msg "--- T=7.0s: IDLE ---"
    probe_ram "IDLE"
    set r [catch {screenshot "MyMSXGame1_40_01_reposo"} out]
    log_msg "SS1: rc=$r path=$out"
}

# T=7.1s: Press and hold RIGHT
after time 7.100 {
    keymatrixdown 8 0x80
    log_msg ""
    log_msg "--- T=7.1s: RIGHT pressed (holding) ---"
}

# T=9.1s: Screenshot 2 - 2s into RIGHT hold (sprite visible, char tiles cleared)
after time 9.100 {
    log_msg ""
    log_msg "--- T=9.1s: HOLDING RIGHT (2s into hold) ---"
    probe_ram "HOLDING_RIGHT"
    set r [catch {screenshot "MyMSXGame1_40_02_empujando_right"} out]
    log_msg "SS2: rc=$r path=$out"
}

# T=9.6s: Release RIGHT (2.5s hold total)
after time 9.600 {
    keymatrixup 8 0x80
    log_msg ""
    log_msg "--- T=9.6s: RIGHT released ---"
}

# T=9.72s: Screenshot 3 - 0.12s after release (~7 frames at 60Hz)
# Game-end event fires at ~9.85s, so we capture here first
after time 9.720 {
    log_msg ""
    log_msg "--- T=9.72s: AFTER RELEASE 0.12s (pre-game-end) ---"
    probe_ram "AFTER_RELEASE"
    set r [catch {screenshot "MyMSXGame1_40_03_tras_soltar_right"} out]
    log_msg "SS3: rc=$r path=$out"
    log_msg ""
    log_msg "=== All 3 screenshots complete ==="
    after time 9.800 { exit }
}
