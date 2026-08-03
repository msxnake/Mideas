set log [open "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-platform/bp_log.txt" w]
set n_step 0; set n_commit 0; set n_update 0; set n_pending 0
debug set_bp 0x43FB {} { incr ::n_step }
debug set_bp 0x4458 {} { incr ::n_commit }
debug set_bp 0x4EBF {} { incr ::n_update }
debug set_bp 0x4FC4 {} { incr ::n_pending }
proc dump {tag} {
    global log
    puts $log "$tag step=$::n_step commit=$::n_commit update=$::n_update pending=$::n_pending comp=[debug read memory 0xC0D1] blk=[debug read memory 0xC0D6] slot=[debug read memory 0xC0E7]"
    flush $log
    set ::n_step 0; set ::n_commit 0; set ::n_update 0; set ::n_pending 0
}
after time 4.0 { dump "t4 (normal): " }
after time 5.0 { dump "t5 (normal): " }
after time 6.0 { dump "t6 (tras cruzar):" }
after time 6.8 { dump "t7 (tras cruzar):" }
after time 7.0 { close $log; exit }
