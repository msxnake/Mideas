set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/base_smoke_log.txt"
set log [open $logpath w]
proc dump {tag} {
    global log
    set px [debug read memory 0xC001]
    set py [debug read memory 0xC000]
    puts $log "$tag px=$px py=$py"
    flush $log
}
after time 4 { dump t4 }
after time 6 { dump t6 }
after time 8 { dump t8 }
after time 10 { dump t10 }
after time 12 { dump t12; close $log; exit }
