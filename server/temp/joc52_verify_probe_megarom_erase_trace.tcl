set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_megarom_erase_trace.log"
set f [open $log_path "w"]
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_shots"
file mkdir $shot_dir

set ::wrt_count 0
set ::ldir_count 0
set ::bios_wrt_count 0
set ::max_logs 220

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc vram8 {addr} { return [debug read VRAM $addr] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc bytes_memory {base count} {
    set out {}
    for {set i 0} {$i < $count} {incr i} {
        lappend out [format "%02X" [mem8 [expr {$base + $i}]]]
    }
    return [join $out " "]
}

proc bytes_vram {base count} {
    set out {}
    for {set i 0} {$i < $count} {incr i} {
        lappend out [format "%02X" [vram8 [expr {$base + $i}]]]
    }
    return [join $out " "]
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set flow [mem8 0xC03B]
    set exit [mem8 0xC03D]
    set screen [mem8 0xE531]
    set px [mem16 0xE53B]
    set py [mem16 0xE53D]
    set cc [mem8 0xDFC7]
    set gem [mem8 0xDFBE]
    set lt [mem8 0xDFC1]
    set lv [mem8 0xDFC2]
    set lx [mem8 0xDFC4]
    set ly [mem8 0xDFC5]
    logline [format "%s pc=%04X sp=%04X p=%02X/%02X/%02X flow=%02X exit=%02X screen=%02X player=%d,%d collected=%02X gem=%02X last=%02X/%02X@%02X,%02X" $tag $pc $sp $p1 $p2 $p3 $flow $exit $screen $px $py $cc $gem $lt $lv $lx $ly]
}

proc rows {tag} {
    state $tag
    foreach row {8 12 16 18 19 20 21} {
        set off [expr {$row * 32}]
        set ram [bytes_memory [expr {0xC457 + $off}] 32]
        set typ [bytes_memory [expr {0xCA57 + $off}] 32]
        set val [bytes_memory [expr {0xCD57 + $off}] 32]
        set tar [bytes_memory [expr {0xD057 + $off}] 32]
        set vrm [bytes_vram [expr {0x1800 + $off}] 32]
        logline [format "%s row=%02d ram=%s" $tag $row $ram]
        logline [format "%s row=%02d typ=%s" $tag $row $typ]
        logline [format "%s row=%02d val=%s" $tag $row $val]
        logline [format "%s row=%02d tar=%s" $tag $row $tar]
        logline [format "%s row=%02d vrm=%s" $tag $row $vrm]
    }
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} {
    state ${tag}_before
    down 1
    after time 0.20 [list up 1]
    after time 0.25 [list state ${tag}_after]
}

proc shot {name tag} {
    global shot_dir
    rows $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} {
        logline "SHOTERR $err"
    } else {
        logline "SHOTOK $name"
    }
}

proc trace_wrt {kind} {
    if {$::wrt_count >= $::max_logs} { return }
    set h [reg H]
    set l [reg L]
    set hl [expr {($h << 8) | $l}]
    if {$hl < 0x1800 || $hl >= 0x1B00} { return }
    set a [reg A]
    set sp [reg SP]
    set ret [mem16 $sp]
    set pc [reg PC]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    incr ::wrt_count
    logline [format "BP_%s n=%03d pc=%04X ret=%04X hl=%04X a=%02X sp=%04X p=%02X/%02X/%02X" $kind $::wrt_count $pc $ret $hl $a $sp $p1 $p2 $p3]
}

proc trace_ldir {kind} {
    if {$::ldir_count >= 80} { return }
    set d [reg D]
    set e [reg E]
    set de [expr {($d << 8) | $e}]
    set b [reg B]
    set c [reg C]
    set bc [expr {($b << 8) | $c}]
    if {$de < 0x1800 || $de >= 0x1B00} { return }
    set h [reg H]
    set l [reg L]
    set hl [expr {($h << 8) | $l}]
    set sp [reg SP]
    set ret [mem16 $sp]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    incr ::ldir_count
    logline [format "BP_%s n=%03d ret=%04X hl=%04X de=%04X bc=%04X sp=%04X p=%02X/%02X/%02X" $kind $::ldir_count $ret $hl $de $bc $sp $p1 $p2 $p3]
}

debug set_bp 0x40E6 {} {
    trace_wrt "FAST_WRTVRM"
    debug cont
}

debug set_bp 0x004D {} {
    trace_wrt "BIOS_WRTVRM"
    debug cont
}

debug set_bp 0x40D0 {} {
    trace_ldir "FAST_LDIRVM"
    debug cont
}

debug set_bp 0x005C {} {
    trace_ldir "BIOS_LDIRVM"
    debug cont
}

debug set_bp 0xA2C1 {} {
    state "BP_clear_screen_area"
    debug cont
}

debug set_bp 0xA2CF {} {
    state "BP_clear_screen_row"
    debug cont
}

debug set_bp 0x7265 {} {
    state "BP_interaction_clear_vram_tile_at_de"
    debug cont
}

after time 6.8  { rows "before_intro_space" }
after time 7.0  { tap_space "intro_space" }
after time 11.8 { rows "before_start_space" }
after time 12.0 { tap_space "start_space" }
after time 12.12 { rows "after_start_012" }
after time 12.35 { rows "after_start_035" }
after time 12.75 { rows "after_start_075" }
after time 13.25 { shot "megarom_erase_trace_1325.png" "after_start_125" }
after time 14.0 {
    down 128
    state "right_down"
}
after time 14.8 {
    up 128
    state "right_up"
}
after time 15.1 { shot "megarom_erase_trace_after_right.png" "after_right" }
after time 16.0 { rows "final"; close $f; exit }
