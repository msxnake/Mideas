set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_gameflow_trace.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/screenshots"
set f [open $log_path "w"]

set bp4010_hits 0
set bp0000_hits 0
set bpstartfar_hits 0
set bptail_hits 0
set bpstart_hits 0
set bphstart_hits 0
set bpstub_hits 0
set bpauto_hits 0
set bpfarram_hits 0
set bpinit_hits 0
set bprestart_hits 0
set bpstubreturn_hits 0
set bpstubbridge_hits 0
set bpcpdone_hits 0
set bpinitstub_hits 0
set bpresentry_hits 0
set bpresrestore_hits 0
set bpresret_hits 0
set bpafterinitcall_hits 0
set bpinitcomponents_hits 0
set bploadpatterns_hits 0
set bploadcolors_hits 0
set bpinitanim_hits 0
set bpinitboss_hits 0
set bpinitentities_hits 0
set bprebuild_hits 0
set bpinitfont_hits 0
set bpinitdone_hits 0
set bpresloadvram_hits 0
set bpresfind_hits 0
set bpresvramzx0_hits 0
set bpresramzx0_hits 0
set bprescopyvram_hits 0
set bpfastldir_hits 0
set bpmapperp3set_hits 0
set bpmapperp3push_hits 0
set bpmapperp3pop_hits 0
set bpmapperp3after_hits 0
set bpdzx0_hits 0

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

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set a [reg A]
    set fflags [reg F]
    set h [reg H]
    set l [reg L]
    set d [reg D]
    set e [reg E]
    set p1 [mem8 0xC11D]
    set p2 [mem8 0xC11E]
    set p3 [mem8 0xC11F]
    set p4 [mem8 0xC120]
    set flow [mem8 0xC104]
    set exit [mem8 0xC106]
    set screen [mem8 0xE187]
    set input [mem8 0xC000]
    set px [mem16 0xE191]
    set py [mem16 0xE193]
    set enabled [mem8 0xE195]
    set irq [mem16 0xE829]
    set tos [mem16 $sp]
    set rbank [mem8 0xC12A]
    set raddr [mem16 0xC12B]
    set rsize [mem16 0xC12D]
    set rraw [mem16 0xC12F]
    set rflags [mem8 0xC131]
    logline [format "%s pc=%04X sp=%04X tos=%04X a=%02X f=%02X hl=%02X%02X de=%02X%02X banks=%02X/%02X/%02X/%02X flow=%02X exit=%02X screen=%02X input=%02X player=%02X xy=%d,%d irq=%d res=%02X/%04X/%04X/%04X/%02X" $tag $pc $sp $tos $a $fflags $h $l $d $e $p1 $p2 $p3 $p4 $flow $exit $screen $input $enabled $px $py $irq $rbank $raddr $rsize $rraw $rflags]
}

proc bytes_at {addr count} {
    set out ""
    for {set i 0} {$i < $count} {incr i} {
        append out [format "%02X " [mem8 [expr {$addr + $i}]]]
    }
    return $out
}

proc limited_bp {counter tag limit} {
    upvar #0 $counter hits
    incr hits
    if {$hits <= $limit} {
        state $tag
    }
    debug cont
}

proc limited_bp_bytes {counter tag limit addr count} {
    upvar #0 $counter hits
    incr hits
    if {$hits <= $limit} {
        state $tag
        logline [format "%s_BYTES_%04X %s" $tag $addr [bytes_at $addr $count]]
    }
    debug cont
}

proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }

proc release {tag masks} {
    foreach m $masks { up $m }
    state ${tag}_after
}

proc hold {tag masks duration} {
    state ${tag}_before
    foreach m $masks { down $m }
    after time 0.30 [list state ${tag}_during]
    after time $duration [list release $tag $masks]
}

proc tap_space {tag} {
    hold $tag {1} 0.22
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

debug set_bp 0x4010 {} { limited_bp bp4010_hits "BP_4010_RESET_OR_BOOT" 20 }
debug set_bp 0x0000 {} { limited_bp bp0000_hits "BP_0000" 8 }
debug set_bp 0x401C {} { limited_bp bprestart_hits "BP_RESTART_ROM" 20 }
debug set_bp 0x4E47 {} { limited_bp bpstartfar_hits "BP_GAMEFLOW_START_FAR" 8 }
debug set_bp 0xC219 {} { limited_bp bptail_hits "BP_ASCII16_TAIL_JUMP" 8 }
debug set_bp 0x6008 {} { limited_bp bpstart_hits "BP_GAMEFLOW_START" 8 }
debug set_bp 0x603B {} { limited_bp bphstart_hits "BP_GAMEFLOW_HANDLE_START" 8 }
debug set_bp 0x6B03 {} { limited_bp bpstub_hits "BP_A16_MAPPER_STUB" 20 }
debug set_bp 0x6B05 {} { limited_bp bpcpdone_hits "BP_A16_MAPPER_STUB_AFTER_CP_BANK" 20 }
debug set_bp 0x6B16 {} { limited_bp bpstubreturn_hits "BP_A16_MAPPER_STUB_RETURN" 20 }
debug set_bp 0x6B18 {} { limited_bp bpstubbridge_hits "BP_A16_MAPPER_STUB_BRIDGE" 20 }
debug set_bp 0x6B59 {} { limited_bp bpinitstub_hits "BP_A16_INIT_GAME_SYSTEMS_STUB" 20 }
debug set_bp 0xC1B9 {} { limited_bp bpresentry_hits "BP_ASCII16_RESIDENT_CALL_ENTRY" 40 }
debug set_bp 0xC1E1 {} { limited_bp bpresrestore_hits "BP_ASCII16_RESIDENT_CALL_RESTORE" 40 }
debug set_bp 0xC1F5 {} { limited_bp bpresret_hits "BP_ASCII16_RESIDENT_CALL_RET" 40 }
debug set_bp 0x6867 {} { limited_bp bpafterinitcall_hits "BP_AFTER_INIT_GAME_SYSTEMS_CALL" 20 }
debug set_bp 0x5494 {} { limited_bp bpinitcomponents_hits "BP_INIT_COMPONENTS_WRAPPER" 20 }
debug set_bp 0x52F4 {} { limited_bp bploadpatterns_hits "BP_LOAD_PATTERNS_FAR" 20 }
debug set_bp 0x537B {} { limited_bp bploadcolors_hits "BP_LOAD_COLORS_FAR" 20 }
debug set_bp 0x5201 {} { limited_bp bpinitanim_hits "BP_INIT_ANIMTILES_FAR" 20 }
debug set_bp 0x5144 {} { limited_bp bpinitboss_hits "BP_INIT_BOSS_FAR" 20 }
debug set_bp 0x4E6B {} { limited_bp bpinitentities_hits "BP_INIT_ENTITIES_FAR" 20 }
debug set_bp 0x54E4 {} { limited_bp bprebuild_hits "BP_REBUILD_USED_ENTITIES_WRAPPER" 20 }
debug set_bp 0x5252 {} { limited_bp bpinitfont_hits "BP_INIT_FONT_FAR" 20 }
debug set_bp 0x5548 {} { limited_bp bpinitdone_hits "BP_INIT_GAME_SYSTEMS_RET" 20 }
debug set_bp 0x41FD {} { limited_bp bpauto_hits "BP_MAPPER_CALL_HL_AUTO" 20 }
debug set_bp 0xC139 {} { limited_bp bpfarram_hits "BP_ASCII16_FAR_CALL_P1_RAM" 20 }
debug set_bp 0x6864 {} { limited_bp bpinit_hits "BP_START_INIT_ROUTINE" 8 }
debug set_bp 0x48BD {} { limited_bp bpresloadvram_hits "BP_RESOURCE_LOAD_TO_VRAM" 40 }
debug set_bp 0x46EB {} { limited_bp bpresfind_hits "BP_RESOURCE_FIND_BY_ID" 40 }
debug set_bp 0x47D8 {} { limited_bp bpresvramzx0_hits "BP_RESOURCE_DECOMPRESS_TO_VRAM" 40 }
debug set_bp 0x478D {} { limited_bp bpresramzx0_hits "BP_RESOURCE_DECOMPRESS_TO_RAM" 40 }
debug set_bp 0x47A6 {} { limited_bp bprescopyvram_hits "BP_RESOURCE_COPY_TO_VRAM" 40 }
debug set_bp 0x40CA {} { limited_bp bpfastldir_hits "BP_FAST_LDIRVM" 40 }
debug set_bp 0x418C {} { limited_bp bpmapperp3set_hits "BP_MAPPER_SET_P3" 60 }
debug set_bp 0x4195 {} { limited_bp_bytes bpmapperp3after_hits "BP_MAPPER_SET_P3_AFTER_WRITE" 40 0x8E3B 24 }
debug set_bp 0x41B3 {} { limited_bp bpmapperp3push_hits "BP_MAPPER_PUSH_P3" 60 }
debug set_bp 0x41BA {} { limited_bp bpmapperp3pop_hits "BP_MAPPER_POP_P3" 60 }
debug set_bp 0x4643 {} { limited_bp_bytes bpdzx0_hits "BP_DZX0_STANDARD" 40 0x8E3B 24 }

after time 7.0 { tap_space "intro_spc" }
after time 12.0 { tap_space "start_spc" }
after time 13.4 { shot "patoantic248_ascii16_trace_start.png" "gameplay_start" }
after time 14.0 { hold "RIGHT" {128} 1.0 }
after time 15.4 { shot "patoantic248_ascii16_trace_after_right.png" "after_right" }
after time 17.0 {
    state "FINAL"
    logline [format "BYTES_6B03 %s" [bytes_at 0x6B03 32]]
    global f bp4010_hits bp0000_hits bpstartfar_hits bptail_hits bpstart_hits bphstart_hits bpstub_hits bpcpdone_hits bpstubreturn_hits bpstubbridge_hits bpinitstub_hits bpresentry_hits bpresrestore_hits bpresret_hits bpafterinitcall_hits bpinitcomponents_hits bploadpatterns_hits bploadcolors_hits bpinitanim_hits bpinitboss_hits bpinitentities_hits bprebuild_hits bpinitfont_hits bpinitdone_hits bpauto_hits bpfarram_hits bpinit_hits bprestart_hits bpresloadvram_hits bpresfind_hits bpresvramzx0_hits bpresramzx0_hits bprescopyvram_hits bpfastldir_hits bpmapperp3set_hits bpmapperp3push_hits bpmapperp3pop_hits bpmapperp3after_hits bpdzx0_hits
    logline [format "COUNTS reset=%d zero=%d restart=%d startfar=%d tail=%d start=%d handleStart=%d stub=%d cpDone=%d stubReturn=%d stubBridge=%d initStub=%d resEntry=%d resRestore=%d resRet=%d afterInitCall=%d initComponents=%d loadPatterns=%d loadColors=%d initAnim=%d initBoss=%d initEntities=%d rebuild=%d initFont=%d initDone=%d auto=%d farram=%d init=%d resLoadVram=%d resFind=%d resVramZx0=%d resRamZx0=%d resCopyVram=%d fastLdir=%d p3set=%d p3after=%d p3push=%d p3pop=%d dzx0=%d" $bp4010_hits $bp0000_hits $bprestart_hits $bpstartfar_hits $bptail_hits $bpstart_hits $bphstart_hits $bpstub_hits $bpcpdone_hits $bpstubreturn_hits $bpstubbridge_hits $bpinitstub_hits $bpresentry_hits $bpresrestore_hits $bpresret_hits $bpafterinitcall_hits $bpinitcomponents_hits $bploadpatterns_hits $bploadcolors_hits $bpinitanim_hits $bpinitboss_hits $bpinitentities_hits $bprebuild_hits $bpinitfont_hits $bpinitdone_hits $bpauto_hits $bpfarram_hits $bpinit_hits $bpresloadvram_hits $bpresfind_hits $bpresvramzx0_hits $bpresramzx0_hits $bprescopyvram_hits $bpfastldir_hits $bpmapperp3set_hits $bpmapperp3after_hits $bpmapperp3push_hits $bpmapperp3pop_hits $bpdzx0_hits]
    close $f
    exit
}
