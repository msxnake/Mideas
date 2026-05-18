set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_player_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/patoantic248_player_probe_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

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
proc vram8 {addr} {
    if {[catch {debug read "VRAM" $addr} value]} {
        return -1
    }
    return $value
}

proc dump_sprites {tag} {
    set ram_base 0xDF7B
    set sat_base 0x1B00
    set text "$tag sprites"
    for {set i 0} {$i < 8} {incr i} {
        set ro [expr {$ram_base + ($i * 4)}]
        set vo [expr {$sat_base + ($i * 4)}]
        append text [format " r%d=%02X,%02X,%02X,%02X/v=%02X,%02X,%02X,%02X" \
            $i \
            [mem8 $ro] [mem8 [expr {$ro + 1}]] [mem8 [expr {$ro + 2}]] [mem8 [expr {$ro + 3}]] \
            [vram8 $vo] [vram8 [expr {$vo + 1}]] [vram8 [expr {$vo + 2}]] [vram8 [expr {$vo + 3}]]]
    }
    logline $text
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC11D]
    set p2 [mem8 0xC11E]
    set p3 [mem8 0xC11F]
    set flow [mem8 0xC104]
    set menu [mem8 0xC107]
    set screen [mem8 0xDFFB]
    set pack [mem8 0xDF7A]
    set slots [mem8 0xE003]
    set px [mem16 0xE005]
    set py [mem16 0xE007]
    set player [mem8 0xE00A]
    set active0 [mem8 0xD77E]
    set ex0 [mem16 0xD95E]
    set ey0 [mem16 0xD97E]
    set sasset0 [mem8 0xDDBF]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X flow=%02X menu=%02X screen=%02X pack=%02X slots=%02X player=%02X pxy=%d,%d e0=%02X exy=%d,%d spriteAsset0=%02X" \
        $tag $pc $sp $p1 $p2 $p3 $flow $menu $screen $pack $slots $player $px $py $active0 $ex0 $ey0 $sasset0]
    dump_sprites $tag
}

proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} {
        logline "SHOTERR $err"
    } else {
        logline "SHOTOK $name"
    }
}

proc press_space {tag} {
    state "${tag}_before"
    keymatrixdown SPACE
    after time 0.35 [list keymatrixup SPACE]
    after time 0.45 [list state "${tag}_after"]
}

proc press_space_row8 {tag} {
    state "${tag}_before"
    keymatrixdown 8 1
    after time 0.35 [list keymatrixup 8 1]
    after time 0.45 [list state "${tag}_after"]
}

proc hold_right {tag} {
    state "${tag}_before"
    keymatrixdown RIGHT
    after time 1.0 [list keymatrixup RIGHT]
    after time 1.1 [list state "${tag}_after"]
}

debug set_bp 0x4010 {} {
    state "BP_4010"
    debug cont
}
debug set_bp 0xA0F0 {} {
    state "BP_submenu"
    debug cont
}
debug set_bp 0xA5AF {} {
    state "BP_worldlink"
    debug cont
}
debug set_bp 0xA702 {} {
    state "BP_worldloop"
    debug cont
}

after time 8.0  { shot "t08_menu.png" "t08_menu" }
after time 9.0  { press_space "space_symbol" }
after time 11.0 { shot "t11_after_symbol_space.png" "t11_after_symbol_space" }
after time 12.0 { press_space_row8 "space_row8" }
after time 14.0 { shot "t14_after_row8_space.png" "t14_after_row8_space" }
after time 15.0 { hold_right "right_symbol" }
after time 17.0 { shot "t17_after_right.png" "t17_after_right" }
after time 19.0 { shot "t19_final.png" "t19_final"; close $f; exit }
