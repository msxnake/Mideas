set out_prefix "C:/Users/salam/Documents/Programacion/Mideas/server/temp/atenas127_msx1_t16"
set log_path "${out_prefix}.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} { return [debug read memory $addr] }
proc vram8 {addr} { return [debug read VRAM $addr] }

proc space_down {} {
    catch {keymatrixdown 8 1}
    catch {keymatrixdown SPACE}
}
proc space_up {} {
    catch {keymatrixup 8 1}
    catch {keymatrixup SPACE}
}
proc tap_space {} {
    space_down
    after time 0.35 { space_up }
}
proc force_done {} {
    debug write memory 0xC11F 4
    tap_space
}

proc dump_range {debuggable path start size} {
    set bf [open $path "wb"]
    fconfigure $bf -translation binary
    puts -nonewline $bf [debug read_block $debuggable $start $size]
    close $bf
}

proc state {tag} {
    set screen [mem8 0xDF7D]
    set engine [mem8 0xDF7E]
    set world [mem8 0xDF81]
    set tilebank [mem8 0xC151]
    set dialog [mem8 0xC0F7]
    logline [format "%s screen=%02X engine=%02X world=%02X tilebank=%02X dialog=%02X" $tag $screen $engine $world $tilebank $dialog]
}

proc dump_all {} {
    global out_prefix f
    state "dump"
    dump_range VRAM "${out_prefix}_vram_0000_3fff.bin" 0x0000 0x4000
    dump_range memory "${out_prefix}_ram_screen_layout.bin" 0xC8BD 768
    dump_range memory "${out_prefix}_ram_behavior.bin" 0xCCBD 768
    close $f
    exit
}

after time 6.0 { force_done }
after time 8.0 { force_done }
after time 16.0 { dump_all }

