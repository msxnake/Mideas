set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/platform_smoke_log.txt"
set log [open $logpath w]
proc dump {tag} {
    global log
    set px [debug read memory 0xC001]
    set py [debug read memory 0xC000]
    set cnt [debug read memory 0xC0E7]
    set rider [debug read memory 0xC0E8]
    set platx [debug read memory 0xC0E9]
    set platy [debug read memory 0xC0EA]
    set platdx [debug read memory 0xC0EB]
    puts $log "$tag px=$px py=$py cnt=$cnt rider=$rider platx=$platx platy=$platy platdx=$platdx"
    flush $log
}
after time 4 { dump t4 }
after time 6 { dump t6 }
after time 8 { dump t8 }
after time 10 { dump t10 }
after time 12 {
    dump t12
    screenshot -prefix platform_smoke_
    close $log
    exit
}
