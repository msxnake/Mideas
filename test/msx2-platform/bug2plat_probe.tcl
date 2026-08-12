set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/bug2plat_log.txt"
set log [open $logpath w]

proc hx {v} { return [format %02X $v] }

proc vram_block {base n} {
    set out ""
    for {set i 0} {$i < $n} {incr i} {
        append out [format %02X [debug read VRAM [expr {$base + $i}]]]
        append out " "
    }
    return $out
}

proc dump {tag} {
    global log
    set cnt    [debug read memory 0xD000]
    set st0    [debug read memory 0xD018]
    set st1    [debug read memory 0xD019]
    set act    [debug read memory 0xD01E]
    set lx     [debug read memory 0xD01A]
    set ly     [debug read memory 0xD01B]
    set p0x    [debug read memory 0xD002]
    set p0y    [debug read memory 0xD003]
    set p1x    [debug read memory 0xD00D]
    set p1y    [debug read memory 0xD00E]
    set px     [debug read memory 0xC001]
    set py     [debug read memory 0xC000]
    puts $log "$tag cnt=$cnt st0=$st0 st1=$st1 light_active=$act lx=$lx ly=$ly p0=($p0x,$p0y) p1=($p1x,$p1y) player=($px,$py)"
    puts $log "     col0 @F420: [vram_block 0xF420 16]"
    puts $log "     col1 @F430: [vram_block 0xF430 16]"
    puts $log "     SAT  @F608: [vram_block 0xF608 12]"
    flush $log
}

after time 2 { dump t2 ; screenshot -prefix bug2plat_t2_ }
after time 4 { dump t4 }
after time 6 { dump t6 ; screenshot -prefix bug2plat_t6_ }
after time 8 { dump t8 }
after time 10 { dump t10 ; screenshot -prefix bug2plat_t10_ }
after time 12 {
    dump t12
    screenshot -prefix bug2plat_t12_
    close $log
    exit
}
