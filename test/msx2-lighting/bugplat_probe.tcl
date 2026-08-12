set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/bugplat3_log.txt"
set log [open $logpath w]

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
    set cnt [debug read memory 0xD009]
    set st0 [debug read memory 0xD021]
    set st1 [debug read memory 0xD022]
    set act [debug read memory 0xD028]
    set lx  [debug read memory 0xD024]
    set ly  [debug read memory 0xD025]
    set p0x [debug read memory 0xD00B]
    set p0y [debug read memory 0xD00C]
    set p1x [debug read memory 0xD016]
    set p1y [debug read memory 0xD017]
    set px  [debug read memory 0xC001]
    set py  [debug read memory 0xC000]
    puts $log "$tag cnt=$cnt st0=$st0 st1=$st1 act=$act light=($lx,$ly) p0=($p0x,$p0y) p1=($p1x,$p1y) player=($px,$py)"
    puts $log "   col0 @F440: [vram_block 0xF440 6]  col1 @F450: [vram_block 0xF450 6]"
    flush $log
}

after time 3  { dump t3 ; screenshot -prefix bugplat3_t3_ }
after time 5  { dump t5 ; screenshot -prefix bugplat3_t5_ }
after time 7  { dump t7 ; screenshot -prefix bugplat3_t7_ }
after time 9  { dump t9 ; screenshot -prefix bugplat3_t9_ }
after time 11 {
    dump t11
    screenshot -prefix bugplat3_t11_
    close $log
    exit
}
