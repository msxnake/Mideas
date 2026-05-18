set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_presentation_probe.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
set f [open $log_path "w"]

array set hits {}

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc bytes_at {addr count} { set out ""; for {set i 0} {$i < $count} {incr i} { append out [format "%02X " [mem8 [expr {$addr + $i}]]] }; return $out }
proc state {tag} {
    set pc [reg PC]; set sp [reg SP]; set a [reg A]; set fflags [reg F]
    set h [reg H]; set l [reg L]; set d [reg D]; set e [reg E]; set b [reg B]; set c [reg C]
    set p1 [mem8 0xC11D]; set p2 [mem8 0xC11E]; set p3 [mem8 0xC11F]; set p4 [mem8 0xC120]
    set rbank [mem8 0xC12A]; set raddr [mem16 0xC12B]; set rsize [mem16 0xC12D]; set rflags [mem8 0xC131]
    set irq [mem16 0xE829]; set player [mem8 0xE195]; set screen [mem8 0xE187]; set input [mem8 0xC000]
    logline [format "%s pc=%04X sp=%04X a=%02X f=%02X bc=%02X%02X hl=%02X%02X de=%02X%02X banks=%02X/%02X/%02X/%02X res=%02X/%04X/%04X/%02X irq=%d player=%02X screen=%02X input=%02X" $tag $pc $sp $a $fflags $b $c $h $l $d $e $p1 $p2 $p3 $p4 $rbank $raddr $rsize $rflags $irq $player $screen $input]
}
proc bp {name limit} {
    global hits
    if {![info exists hits($name)]} { set hits($name) 0 }
    incr hits($name)
    if {$hits($name) <= $limit} { state $name }
    debug cont
}
proc bpbytes {name limit addr count} {
    global hits
    if {![info exists hits($name)]} { set hits($name) 0 }
    incr hits($name)
    if {$hits($name) <= $limit} { state $name; logline [format "%s_BYTES_%04X %s" $name $addr [bytes_at $addr $count]] }
    debug cont
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state ${tag}_before; down 1; after time 0.22 [list up 1]; after time 0.30 [list state ${tag}_after] }
proc shot {name tag} { global shot_dir; state $tag; catch {screenshot "$shot_dir/$name"} err; logline "SHOT $name $err" }

# boot/reset
# page0 / resident
# gameflow bank 6 addresses from current .sym
# show presentation far is resident bank0, image routine is bank5/7 depending mapped segment.
debug set_bp 0x4010 {} { bp BOOT_4010 4 }
debug set_bp 0x0000 {} { bp ZERO_0000 4 }
debug set_bp 0x6008 {} { bp GAMEFLOW_START 8 }
debug set_bp 0x600E {} { bp GAMEFLOW_EXECUTE_NODE 20 }
debug set_bp 0x603B {} { bp HANDLE_START 8 }
debug set_bp 0x65AE {} { bp PRES_WAIT_FIRE 8 }
debug set_bp 0x65CB {} { bp HANDLE_MUSIC 8 }
debug set_bp 0x6590 {} { bp HANDLE_PRESENTATION 8 }
debug set_bp 0x4DC0 {} { bp SHOW_PRESENTATION_IMAGE_FAR 8 }
debug set_bp 0x6047 {} { bp SHOW_PRESENTATION_IMAGE 8 }
debug set_bp 0x48BD {} { bp RESOURCE_LOAD_VRAM 30 }
debug set_bp 0x46EB {} { bp RESOURCE_FIND 30 }
debug set_bp 0x47D8 {} { bp RESOURCE_DECOMPRESS_VRAM 30 }
debug set_bp 0x47A6 {} { bp RESOURCE_COPY_VRAM 30 }
debug set_bp 0x40CA {} { bp FAST_LDIRVM 30 }
debug set_bp 0x4195 {} { bpbytes MAPPER_P3_AFTER 30 0x8000 16 }
debug set_bp 0x6858 {} { bp NODE_START_DATA 8 }
debug set_bp 0x6983 {} { bp NODE_PRESENTATION_DATA 8 }

after time 4.0 { shot "patoantic248_ascii16_presentation_t4.png" "T4" }
after time 7.0 { tap_space "SPC1" }
after time 9.5 { shot "patoantic248_ascii16_presentation_t95.png" "T95" }
after time 12.0 { tap_space "SPC2" }
after time 14.5 { shot "patoantic248_ascii16_presentation_t145.png" "T145" }
after time 16.0 {
    state FINAL
    global hits f
    foreach k [lsort [array names hits]] { logline [format "COUNT %s %d" $k $hits($k)] }
    close $f
    exit
}
