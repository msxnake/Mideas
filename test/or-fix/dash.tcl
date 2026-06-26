set probe_path "C:/Users/salam/Documents/Programacion/Mideas/test/or-fix/dash_probe.txt"
set shot_path "C:/Users/salam/Documents/Programacion/Mideas/test/or-fix/newOne10_dash.png"
after time 5.0 {
    set ::x0 [debug read memory 0xC001]
    set ::y0 [debug read memory 0xC000]
    set ::f0 [debug read memory 0xC008]
    keymatrixdown 4 0x04
}
after time 5.18 {
    set ::xmid [debug read memory 0xC001]
    set ::tmid [debug read memory 0xC0D9]
}
after time 5.6 {
    set f [open $::probe_path w]
    puts $f [format "x0=%d y0=%d facing0=%d" $::x0 $::y0 $::f0]
    puts $f [format "x_mid=%d dash_timer_mid=%d" $::xmid $::tmid]
    puts $f [format "x_final=%d" [debug read memory 0xC001]]
    puts $f [format "dash_timer_final=%d" [debug read memory 0xC0D9]]
    puts $f [format "dash_cooldown=%d" [debug read memory 0xC0DA]]
    puts $f [format "dash_dir=%d" [debug read memory 0xC0DC]]
    puts $f [format "dash_lock=%d" [debug read memory 0xC0DB]]
    puts $f [format "player_y_final=%d" [debug read memory 0xC000]]
    close $f
    screenshot $::shot_path
    keymatrixup 4 0x04
    after time 0.2 { exit }
}
