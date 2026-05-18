set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/tales7_plain48k_trace.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/tales7_plain48k_trace_shots"
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} {
    if {[catch {debug read memory $addr} value]} {
        return 0
    }
    return $value
}

proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set slot [expr {[catch {debug read "slotted memory" 0xFFFF} v] ? 0 : $v}]
    set prim [mem8 0xC111]
    set romslot [mem8 0xC110]
    set p0bios [mem8 0xC112]
    set p2slot [mem8 0xC113]
    set p3slot [mem8 0xC114]
    set sub [mem8 0xC115]
    set mb1 [mem8 0xC116]
    set mb2 [mem8 0xC117]
    set mb3 [mem8 0xC118]
    set mb4 [mem8 0xC119]
    set flow [mem8 0xC03B]
    set screen [mem8 0xE531]
    set irq [mem16 0xC047]
    set px [mem16 0xE53B]
    set py [mem16 0xE53D]
    logline [format "%s pc=%04X sp=%04X slotFFFF=%02X slots prim=%02X sub=%02X rom=%02X p0=%02X p2=%02X p3=%02X banks=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X pos=%d,%d" $tag $pc $sp $slot $prim $sub $romslot $p0bios $p2slot $p3slot $mb1 $mb2 $mb3 $mb4 $flow $screen $irq $px $py]
}

proc bp {addr name} {
    debug set_bp $addr {} "state \"$name\"; debug cont"
}

bp 0x4010 "BP_4010"
bp 0x4022 "BP_restart_continue"
bp 0x71C1 "BP_init_page0_state"
bp 0x415D "BP_mapper_runtime_init"
bp 0x420E "BP_interrupt_dispatcher"
bp 0x6F18 "BP_gameflow_start"
bp 0x5D52 "BP_load_screen"
bp 0x721F "BP_page0_map_game_rom"
bp 0x7226 "BP_page0_restore_bios"
bp 0x722E "BP_page0_copy_chunk"
bp 0x723B "BP_page0_decompress_to_ram"
bp 0x7269 "BP_page0_copy_to_ram"
bp 0x0038 "BP_IM1_0038"
bp 0xFFFF "BP_FFFF"

after time 0.5 { state "t00_5" }
after time 1.0 { state "t01" }
after time 2.0 { state "t02" }
after time 3.0 { state "t03" }
after time 4.0 { state "t04" }
after time 5.0 { state "t05" }
after time 6.0 {
    state "t06"
    if {[catch {screenshot "$shot_dir/tales7_plain48k_trace_t06.png"} err]} {
        logline "SHOTERR $err"
    } else {
        logline "SHOTOK tales7_plain48k_trace_t06.png"
    }
}
after time 8.0 { state "t08"; close $f; exit }
