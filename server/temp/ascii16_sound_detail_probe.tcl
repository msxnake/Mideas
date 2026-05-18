set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/ascii16_sound_detail_probe.log"
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
logline "probe_start"
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; return [expr {$lo | ($hi << 8)}] }
proc reg16 {name} {
    if {[catch {reg $name} value]} {
        logline "REGERR $name $value"
        return 0
    }
    return $value
}

array set bpcount {}
proc state {tag} {
    set pc [reg16 PC]
    set sp [reg16 SP]
    set p1 [mem8 0xC11D]
    set p2 [mem8 0xC11E]
    set p3 [mem8 0xC11F]
    set p4 [mem8 0xC120]
    set flow [mem8 0xC104]
    set screen [mem8 0xE0E6]
    set inirq [mem8 0xE78D]
    set st0 [mem16 $sp]
    set st2 [mem16 [expr {$sp + 2}]]
    set farbank [mem8 0xC128]
    set oldbank [mem8 0xC12A]
    set fartarget [mem16 0xC126]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X inirq=%02X stk=%04X,%04X far=%02X old=%02X target=%04X" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $inirq $st0 $st2 $farbank $oldbank $fartarget]
}

proc bp {addr tag {limit 16}} {
    if {[catch {debug set_bp $addr {} "global bpcount; if {![info exists bpcount($tag)]} { set bpcount($tag) 0 }; incr bpcount($tag); if {\$bpcount($tag) <= $limit} { state \"$tag#\$bpcount($tag)\" }; debug cont"} err]} {
        logline "BPERR $tag $err"
    } else {
        logline [format "BPSET %s %04X" $tag $addr]
    }
}

bp 0x4010 BOOT 4
bp 0x4F31 INIT_SOUND_FAR 8
bp 0x4F43 INIT_SOUND_FAR_RETURN 8
bp 0xC139 FARCALL_ENTRY 16
bp 0xC15A FARCALL_RETURN 16
bp 0x6000 SOUND_ENTRY 8
bp 0x6016 SOUND_CALL_MUSIC 8
bp 0x6019 SOUND_CALL_SILENCE 8
bp 0x601C SOUND_RET 8
bp 0x619E MUSIC_INIT 8
bp 0x61AF MUSIC_SILENCE 8
bp 0x6080 SFX_SILENCE 8
bp 0x6055 PSG_SET_VOLUME 12
bp 0x6063 PSG_SET_MIXER 8
bp 0x602C PSG_WRITE 24
bp 0x6086 SFX_AFTER_VOL_A 8
bp 0x608D SFX_AFTER_VOL_B 8
bp 0x6094 SFX_AFTER_VOL_C 8
bp 0x6099 SFX_RET 8
bp 0x4D65 GAMEFLOW_INIT_FAR 8
bp 0x4D79 GAMEFLOW_START_FAR 8

debug cont
after time 1.0 { state "t1" }
after time 2.0 { state "t2" }
after time 4.0 { state "t4" }
after time 6.0 { state "t6" }
after time 8.0 { state "t8"; close $f; exit }
