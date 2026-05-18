set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc64_gameplay_vector_capture_active.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp"
set f [open $log_path "w"]
set shot_count 0
set last_active 0

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
proc signed8 {v} {
    if {$v >= 128} { return [expr {$v - 256}] }
    return $v
}

proc state_line {tag} {
    set px [mem16 0xE188]
    set py [mem16 0xE18A]
    set active [mem8 0xC047]
    set bx [mem8 0xC048]
    set by [mem8 0xC049]
    set vx [signed8 [mem8 0xC051]]
    set vy [signed8 [mem8 0xC052]]
    set ax [mem8 0xC053]
    set ay [mem8 0xC054]
    set target [mem8 0xC039]
    set tick [mem8 0xC005]
    return [format "%s tick=%03d player=%d,%d projectileActive=%d projectile=%d,%d vel=%d,%d abs=%d,%d target=%d" $tag $tick $px $py $active $bx $by $vx $vy $ax $ay $target]
}

proc state {tag} { logline [state_line $tag] }
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_jump {tag} {
    state ${tag}_before
    down 1
    after time 0.12 [list up 1]
    after time 0.16 [list state ${tag}_after]
}

proc poll_projectile {} {
    global shot_count last_active shot_dir f
    set active [mem8 0xC047]
    if {$active != 0 && $last_active == 0 && $shot_count < 3} {
        incr shot_count
        set name [format "joc64_gameplay_active_frame%d.png" $shot_count]
        logline [state_line [format "active_frame%d" $shot_count]]
        if {[catch {screenshot "$shot_dir/$name"} err]} {
            logline "SHOTERR $name $err"
        } else {
            logline "SHOTOK $name"
        }
        if {$shot_count == 1} {
            down 128
            state "right_down_after_frame1"
            after time 0.25 [list tap_jump "jump_after_frame1_1"]
            after time 1.00 [list tap_jump "jump_after_frame1_2"]
            after time 1.85 [list tap_jump "jump_after_frame1_3"]
            after time 2.75 [list tap_jump "jump_after_frame1_4"]
            after time 3.65 [list tap_jump "jump_after_frame1_5"]
        }
    }
    set last_active $active
    if {$shot_count >= 3} {
        up 128
        state "done"
        close $f
        exit
    }
    after time 0.05 poll_projectile
}

after time 3.2  { state "waiting_left_first_shot" }
after time 3.55 { tap_jump "jump1" }
after time 4.25 { tap_jump "jump2" }
after time 5.10 { tap_jump "jump3" }
after time 6.00 { tap_jump "jump4" }
after time 6.90 { tap_jump "jump5" }
after time 3.3  { poll_projectile }
after time 25.0 { up 128; state "timeout"; close $f; exit }
